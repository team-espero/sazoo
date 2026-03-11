import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const projectRoot = process.cwd();
const now = new Date();
const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
const baselineRoot = path.join(projectRoot, 'docs', 'baselines', timestamp);
const localCaptureDir = path.join(baselineRoot, 'captures-local');
const publicCaptureDir = path.join(baselineRoot, 'captures-public');
const apiDir = path.join(baselineRoot, 'api-examples');
const assetDir = path.join(baselineRoot, 'asset-snapshot');
const manifestPath = path.join(baselineRoot, 'baseline-manifest.json');
const readmePath = path.join(baselineRoot, 'README.md');

const LOCAL_PREVIEW_URL = process.env.BASELINE_LOCAL_URL || 'http://127.0.0.1:4273';
const LOCAL_PREVIEW_PORT = Number(new URL(LOCAL_PREVIEW_URL).port || 4273);
const PUBLIC_BASELINE_URL = process.env.BASELINE_PUBLIC_URL || 'https://sazoo.vercel.app';
const HTTP_OK = new Set([200, 304]);
const ASSET_DIRS = ['public', 'assets', 'video', '3d asset'];

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';
const nodeCmd = process.execPath;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function startProcess(command, args, options = {}) {
  const { useShell = false, ...restOptions } = options;
  const child = spawn(command, args, {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: useShell,
    ...restOptions,
  });

  let stdout = '';
  let stderr = '';

  child.stdout?.on('data', (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr?.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  return { child, getStdout: () => stdout, getStderr: () => stderr };
}

async function runCommand(command, args, options = {}) {
  const { child, getStdout, getStderr } = startProcess(command, args, options);

  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });

  if (exitCode !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}\nSTDOUT:\n${getStdout()}\nSTDERR:\n${getStderr()}`);
  }

  return {
    stdout: getStdout(),
    stderr: getStderr(),
  };
}

async function waitForHttp(url, timeoutMs = 45000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (HTTP_OK.has(response.status)) {
        return true;
      }
    } catch {
      // retry
    }
    await sleep(500);
  }

  return false;
}

async function withManagedProcess(command, args, readyUrl, callback, options = {}) {
  const proc = startProcess(command, args, options);

  try {
    const ready = await waitForHttp(readyUrl);
    if (!ready) {
      throw new Error(`Process did not become ready: ${command} ${args.join(' ')}\n${proc.getStderr()}`);
    }
    return await callback(proc);
  } finally {
    proc.child.kill();
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listFilesRecursively(rootDir) {
  const results = [];
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listFilesRecursively(absolutePath)));
    } else {
      results.push(absolutePath);
    }
  }

  return results;
}

async function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(await fs.readFile(filePath));
  return hash.digest('hex');
}

async function generateAssetSnapshot() {
  await ensureDir(assetDir);

  const snapshot = {
    capturedAt: now.toISOString(),
    root: projectRoot,
    directories: {},
    totals: {
      fileCount: 0,
      totalBytes: 0,
    },
  };

  for (const relativeDir of ASSET_DIRS) {
    const absoluteDir = path.join(projectRoot, relativeDir);
    if (!(await pathExists(absoluteDir))) continue;

    const files = await listFilesRecursively(absoluteDir);
    const normalizedFiles = [];
    let totalBytes = 0;

    for (const filePath of files) {
      const stat = await fs.stat(filePath);
      const hash = await sha256File(filePath);
      totalBytes += stat.size;
      snapshot.totals.fileCount += 1;
      snapshot.totals.totalBytes += stat.size;
      normalizedFiles.push({
        path: path.relative(projectRoot, filePath).replace(/\\/g, '/'),
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        sha256: hash,
      });
    }

    normalizedFiles.sort((a, b) => a.path.localeCompare(b.path));
    snapshot.directories[relativeDir] = {
      fileCount: normalizedFiles.length,
      totalBytes,
      files: normalizedFiles,
    };
  }

  await fs.writeFile(path.join(assetDir, 'asset-snapshot.json'), JSON.stringify(snapshot, null, 2), 'utf8');

  const lines = [
    '# Asset Snapshot',
    '',
    `- Captured At: \`${snapshot.capturedAt}\``,
    `- Total Files: \`${snapshot.totals.fileCount}\``,
    `- Total Bytes: \`${snapshot.totals.totalBytes}\``,
    '',
    '| Directory | Files | Bytes |',
    '|---|---:|---:|',
    ...Object.entries(snapshot.directories).map(([dir, info]) => `| ${dir} | ${info.fileCount} | ${info.totalBytes} |`),
    '',
  ];

  await fs.writeFile(path.join(assetDir, 'asset-snapshot.md'), lines.join('\n'), 'utf8');
  return snapshot;
}

async function generateApiExamples() {
  await ensureDir(apiDir);

  const profile = {
    id: 'baseline-user',
    name: '源?뺤슧',
    gender: 'male',
    birthDate: {
      year: 1993,
      month: 5,
      day: 6,
      hour: 11,
      minute: 30,
      ampm: 'AM',
    },
    calendarType: '?묐젰',
    isTimeUnknown: false,
    relation: 'me',
    memo: '',
  };

  const chatRequest = {
    message: '?ㅻ뒛 ?댁꽭瑜?遺?쒕읇怨??먮졆?섍쾶 ?ㅻ챸?댁쨾.',
    language: 'ko',
    profile,
    saju: {},
    isInitialAnalysis: false,
  };

  const dailyInsightsRequest = {
    language: 'ko',
    date: '2026-03-10',
    profile,
    saju: {},
  };

  const writeJson = async (name, value) => {
    await fs.writeFile(path.join(apiDir, name), JSON.stringify(value, null, 2), 'utf8');
  };

  await writeJson('fortune-chat.request.json', chatRequest);
  await writeJson('fortune-daily-insights.request.json', dailyInsightsRequest);

  return await withManagedProcess(
    nodeCmd,
    ['server/index.js'],
    'http://127.0.0.1:8787/health',
    async () => {
      const [chatResponse, insightsResponse] = await Promise.all([
        fetch('http://127.0.0.1:8787/api/v1/fortune/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chatRequest),
        }),
        fetch('http://127.0.0.1:8787/api/v1/fortune/daily-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dailyInsightsRequest),
        }),
      ]);

      const chatBody = await chatResponse.json();
      const insightsBody = await insightsResponse.json();

      await writeJson('fortune-chat.response.json', chatBody);
      await writeJson('fortune-daily-insights.response.json', insightsBody);

      const exampleIndex = [
        '# API Example Snapshot',
        '',
        `- Captured At: \`${now.toISOString()}\``,
        '',
        '| Endpoint | Request | Response | HTTP |',
        '|---|---|---|---:|',
        `| /fortune/chat | \`fortune-chat.request.json\` | \`fortune-chat.response.json\` | ${chatResponse.status} |`,
        `| /fortune/daily-insights | \`fortune-daily-insights.request.json\` | \`fortune-daily-insights.response.json\` | ${insightsResponse.status} |`,
        '',
      ];

      await fs.writeFile(path.join(apiDir, 'README.md'), exampleIndex.join('\n'), 'utf8');

      return {
        chatStatus: chatResponse.status,
        insightsStatus: insightsResponse.status,
      };
    },
  );
}

async function runCapture(baseUrl, outputDir) {
  await ensureDir(outputDir);
  await runCommand(nodeCmd, ['scripts/capture-app-workflow.mjs'], {
    env: {
      ...process.env,
      CAPTURE_BASE_URL: baseUrl,
      CAPTURE_OUTPUT_DIR: outputDir,
      CAPTURE_USE_MOCKS: '1',
    },
  });
}

async function isReachable(url) {
  try {
    const response = await fetch(url, { method: 'GET' });
    return HTTP_OK.has(response.status);
  } catch {
    return false;
  }
}

async function generateReadme(manifest) {
  const lines = [
    '# Product Baseline Freeze',
    '',
    `- Captured At: \`${manifest.capturedAt}\``,
    `- Local Preview URL: \`${manifest.localPreviewUrl}\``,
    `- Public URL: \`${manifest.publicUrl || 'unavailable'}\``,
    '',
    '## Artifacts',
    '',
    '- Local screen capture index: `captures-local/index.md`',
    manifest.publicCaptureAvailable
      ? '- Public screen capture index: `captures-public/index.md`'
      : '- Public screen capture index: unavailable during this freeze run',
    '- API example index: `api-examples/README.md`',
    '- Asset snapshot: `asset-snapshot/asset-snapshot.md`',
    '',
    '## Purpose',
    '',
    '- Use these artifacts for visual regression checks before launch work.',
    '- Use the API example files to compare request and response shape changes.',
    '- Use the asset snapshot to detect accidental asset churn.',
    '',
  ];

  await fs.writeFile(readmePath, lines.join('\n'), 'utf8');
}

async function main() {
  await ensureDir(baselineRoot);
  await ensureDir(localCaptureDir);
  await ensureDir(apiDir);
  await ensureDir(assetDir);

  await runCommand(npmCmd, ['run', 'build'], { useShell: isWindows });

  await withManagedProcess(
    npxCmd,
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(LOCAL_PREVIEW_PORT), '--strictPort'],
    LOCAL_PREVIEW_URL,
    async () => {
      await runCapture(LOCAL_PREVIEW_URL, localCaptureDir);
    },
    { useShell: isWindows },
  );

  const publicCaptureAvailable = await isReachable(PUBLIC_BASELINE_URL);
  if (publicCaptureAvailable) {
    await runCapture(PUBLIC_BASELINE_URL, publicCaptureDir);
  }

  const apiStatus = await generateApiExamples();
  const assetSnapshot = await generateAssetSnapshot();

  const manifest = {
    capturedAt: now.toISOString(),
    baselineRoot: path.relative(projectRoot, baselineRoot).replace(/\\/g, '/'),
    localPreviewUrl: LOCAL_PREVIEW_URL,
    publicUrl: publicCaptureAvailable ? PUBLIC_BASELINE_URL : null,
    publicCaptureAvailable,
    apiStatus,
    assetTotals: assetSnapshot.totals,
    artifacts: {
      localCaptureIndex: path.relative(projectRoot, path.join(localCaptureDir, 'index.md')).replace(/\\/g, '/'),
      publicCaptureIndex: publicCaptureAvailable
        ? path.relative(projectRoot, path.join(publicCaptureDir, 'index.md')).replace(/\\/g, '/')
        : null,
      apiExamples: path.relative(projectRoot, path.join(apiDir, 'README.md')).replace(/\\/g, '/'),
      assetSnapshot: path.relative(projectRoot, path.join(assetDir, 'asset-snapshot.md')).replace(/\\/g, '/'),
    },
  };

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  await generateReadme(manifest);

  console.log(`BASELINE_DIR=${baselineRoot}`);
  console.log(`BASELINE_MANIFEST=${manifestPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

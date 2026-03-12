import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packageJsonPath = path.join(root, 'package.json');
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
const xcodeprojPath = path.join(root, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function parseKind() {
  const kind = getArg('--kind', 'patch');
  if (!['major', 'minor', 'patch'].includes(kind)) {
    throw new Error(`Invalid --kind value: ${kind}`);
  }
  return kind;
}

function bumpSemver(version, kind) {
  const raw = version.split('.').map((part) => Number(part));
  if (raw.some((num) => Number.isNaN(num))) {
    throw new Error(`Version is not numeric: ${version}`);
  }

  const parts = [raw[0] ?? 0, raw[1] ?? 0, raw[2] ?? 0];
  if (kind === 'major') {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  } else if (kind === 'minor') {
    parts[1] += 1;
    parts[2] = 0;
  } else {
    parts[2] += 1;
  }

  return parts.join('.');
}

function replaceAllOrThrow(content, pattern, replacer, label) {
  const next = content.replace(pattern, replacer);
  if (next === content) {
    throw new Error(`Could not update ${label}`);
  }
  return next;
}

async function main() {
  const kind = parseKind();
  const explicitVersion = getArg('--version', null);
  const explicitBuildArg = getArg('--build', null);

  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
  const gradle = await fs.readFile(gradlePath, 'utf8');
  const xcodeproj = await fs.readFile(xcodeprojPath, 'utf8');

  const androidCodeMatch = gradle.match(/versionCode\s+(\d+)/);
  const androidNameMatch = gradle.match(/versionName\s+"([^"]+)"/);
  const iosBuildMatch = xcodeproj.match(/CURRENT_PROJECT_VERSION = (\d+);/);
  const iosMarketingMatch = xcodeproj.match(/MARKETING_VERSION = ([^;]+);/);

  if (!androidCodeMatch || !androidNameMatch) {
    throw new Error('Could not find Android versionCode/versionName in android/app/build.gradle');
  }
  if (!iosBuildMatch || !iosMarketingMatch) {
    throw new Error('Could not find iOS CURRENT_PROJECT_VERSION/MARKETING_VERSION in ios/App/App.xcodeproj/project.pbxproj');
  }

  const oldVersion = packageJson.version || androidNameMatch[1];
  const newVersion = explicitVersion || bumpSemver(oldVersion, kind);
  const oldBuild = Number(androidCodeMatch[1]);
  const newBuild = explicitBuildArg ? Number(explicitBuildArg) : oldBuild + 1;

  if (!Number.isInteger(newBuild) || newBuild <= 0) {
    throw new Error(`Invalid build number: ${explicitBuildArg}`);
  }

  packageJson.version = newVersion;
  await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');

  const updatedGradle = gradle
    .replace(/versionCode\s+\d+/, `versionCode ${newBuild}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
  await fs.writeFile(gradlePath, updatedGradle, 'utf8');

  let updatedXcodeproj = xcodeproj;
  updatedXcodeproj = replaceAllOrThrow(
    updatedXcodeproj,
    /CURRENT_PROJECT_VERSION = \d+;/g,
    `CURRENT_PROJECT_VERSION = ${newBuild};`,
    'iOS CURRENT_PROJECT_VERSION',
  );
  updatedXcodeproj = replaceAllOrThrow(
    updatedXcodeproj,
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${newVersion};`,
    'iOS MARKETING_VERSION',
  );
  await fs.writeFile(xcodeprojPath, updatedXcodeproj, 'utf8');

  console.log(
    `Mobile version updated: ${oldVersion} (${oldBuild}) -> ${newVersion} (${newBuild})`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

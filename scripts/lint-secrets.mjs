import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const includeRoots = ['src', 'screens', 'components', 'App.tsx', 'context.tsx', 'components.tsx', 'utils.ts', 'index.tsx'];
const forbiddenPatterns = [
  /GEMINI_API_KEY/g,
  /VITE_GEMINI_API_KEY/g,
  /AIza[0-9A-Za-z_\-]{20,}/g,
];

async function collectFiles(entryPath) {
  const absolutePath = path.join(root, entryPath);
  const stat = await fs.stat(absolutePath);

  if (stat.isFile()) {
    return [absolutePath];
  }

  const entries = await fs.readdir(absolutePath, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist')
      .map(async (entry) => {
        const nextPath = path.join(entryPath, entry.name);
        return collectFiles(nextPath);
      }),
  );

  return files.flat();
}

async function main() {
  const files = (await Promise.all(includeRoots.map((entry) => collectFiles(entry)))).flat();
  const targetFiles = files.filter((filePath) => /\.(tsx?|jsx?)$/.test(filePath));
  const violations = [];

  for (const filePath of targetFiles) {
    const content = await fs.readFile(filePath, 'utf8');
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        violations.push({ filePath: path.relative(root, filePath), pattern: pattern.toString() });
      }
      pattern.lastIndex = 0;
    }
  }

  if (violations.length > 0) {
    console.error('Secret lint failed. Remove forbidden patterns from frontend source files:');
    for (const violation of violations) {
      console.error(`- ${violation.filePath} (${violation.pattern})`);
    }
    process.exit(1);
  }

  console.log('Secret lint passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


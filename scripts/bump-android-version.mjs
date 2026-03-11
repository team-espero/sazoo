import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
const packageJsonPath = path.join(root, 'package.json');

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
    throw new Error(`versionName is not numeric: ${version}`);
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

async function main() {
  const kind = parseKind();
  const explicitVersion = getArg('--version', null);
  const explicitCodeArg = getArg('--code', null);
  const syncPackage = process.argv.includes('--no-sync-package') ? false : true;

  const gradle = await fs.readFile(gradlePath, 'utf8');
  const codeMatch = gradle.match(/versionCode\s+(\d+)/);
  const nameMatch = gradle.match(/versionName\s+"([^"]+)"/);
  if (!codeMatch || !nameMatch) {
    throw new Error('Could not find versionCode/versionName in android/app/build.gradle');
  }

  const oldCode = Number(codeMatch[1]);
  const oldVersion = nameMatch[1];
  const newCode = explicitCodeArg ? Number(explicitCodeArg) : oldCode + 1;
  if (!Number.isInteger(newCode) || newCode <= 0) {
    throw new Error(`Invalid versionCode: ${explicitCodeArg}`);
  }

  const newVersion = explicitVersion ? explicitVersion : bumpSemver(oldVersion, kind);

  const updatedGradle = gradle
    .replace(/versionCode\s+\d+/, `versionCode ${newCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
  await fs.writeFile(gradlePath, updatedGradle, 'utf8');

  if (syncPackage) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    packageJson.version = newVersion;
    await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
  }

  console.log(`Android version updated: ${oldVersion} (${oldCode}) -> ${newVersion} (${newCode})`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

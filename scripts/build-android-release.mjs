import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const androidDir = path.join(root, 'android');
const isWindows = process.platform === 'win32';

function detectJavaHome() {
  if (process.env.JAVA_HOME && existsSync(process.env.JAVA_HOME)) {
    return process.env.JAVA_HOME;
  }

  const candidates = [
    'C:\\tools\\jdk-21.0.10+7',
    'C:\\Program Files\\Java\\jdk-21',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21',
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function detectAndroidSdk() {
  if (process.env.ANDROID_SDK_ROOT && existsSync(process.env.ANDROID_SDK_ROOT)) {
    return process.env.ANDROID_SDK_ROOT;
  }
  if (existsSync('C:\\Android')) return 'C:\\Android';
  return null;
}

function run(command, args, cwd, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
    });
    child.on('error', reject);
  });
}

async function main() {
  const javaHome = detectJavaHome();
  const androidSdk = detectAndroidSdk();
  if (!javaHome) {
    throw new Error('JAVA_HOME not found. Set JAVA_HOME to JDK 21 path.');
  }
  if (!androidSdk) {
    throw new Error('ANDROID_SDK_ROOT not found. Set ANDROID_SDK_ROOT to Android SDK path.');
  }

  const env = { ...process.env };
  env.JAVA_HOME = javaHome;
  env.ANDROID_SDK_ROOT = androidSdk;
  env.ANDROID_HOME = androidSdk;
  env.Path = `${path.join(javaHome, 'bin')};${path.join(androidSdk, 'platform-tools')};${env.Path ?? ''}`;

  if (isWindows) {
    await run('npm.cmd', ['run', 'mobile:sync'], root, env);
    await run('gradlew.bat', ['assembleRelease', 'bundleRelease', '--no-daemon'], androidDir, env);
  } else {
    await run('npm', ['run', 'mobile:sync'], root, env);
    await run('./gradlew', ['assembleRelease', 'bundleRelease', '--no-daemon'], androidDir, env);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

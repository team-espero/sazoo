# 10 Capacitor Setup

## Setup Applied
- Added: `capacitor.config.ts`
- Added platforms:
  - `android/`
  - `ios/`

## Commands Executed
1. `npx cap add android` => PASS
2. `npx cap add ios` => PASS (with warnings)
3. `npx cap sync` => PASS

## Build + Sync Path
- Windows build output: `C:/temp/sazoo-dist`
- Capacitor `webDir` points to this path on Windows

## Android Verification
- Command: `android/gradlew.bat tasks --all`
- Result: FAIL (JAVA_HOME not set)
- Action: Install JDK and set `JAVA_HOME`

## iOS Verification
- Platform files generated on Windows
- Warnings:
  - CocoaPods not installed
  - xcodebuild not found
- Action: On macOS, install Xcode + CocoaPods, then run `npx cap sync ios` and build in Xcode

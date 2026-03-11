import type { CapacitorConfig } from '@capacitor/cli';

const webDir = process.platform === 'win32' ? 'C:/temp/sazoo-dist' : 'dist';

const config: CapacitorConfig = {
  appId: 'com.sazoo.app',
  appName: 'Sazoo',
  webDir,
  server: {
    androidScheme: 'https',
  },
};

export default config;


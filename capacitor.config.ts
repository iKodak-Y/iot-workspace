import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iot.residentapp',
  appName: 'App Residentes',
  webDir: 'dist/resident-app/browser',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;

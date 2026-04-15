import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sukeret.mydiabetes',
  appName: 'הסוכרת שלי',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#FFF8F1',
      showSpinner: false,
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#FFF8F1',
    },
  },
};

export default config;

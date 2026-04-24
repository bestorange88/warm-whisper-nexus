import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'chat.archime.app',
  appName: '阿基米聊',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: '#ffffff',
    scrollEnabled: false,
  },
  plugins: {
    Keyboard: {
      resize: 'native',
      style: 'light',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff',
      overlaysWebView: true,
    },
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
  },
};

export default config;

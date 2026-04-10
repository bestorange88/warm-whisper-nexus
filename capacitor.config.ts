import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'chat.archime.app',
  appName: '阿基米聊',
  webDir: 'dist',
  server: {
    url: 'https://b97bc21c-1df9-48d4-b0f4-9f1416c25982.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;

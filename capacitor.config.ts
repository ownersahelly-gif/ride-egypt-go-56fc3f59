import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.massarride',
  appName: 'ride-egypt-go',
  webDir: 'dist',
  server: {
    url: 'https://58eae2d4-67b4-4835-a743-94a6f9cad6dd.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;

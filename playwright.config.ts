import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests',
  testMatch: 'pwa-phase7.spec.ts',
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',
    launchOptions: {
      slowMo: 50,
    },
  },
  reporter: [['list']],
});

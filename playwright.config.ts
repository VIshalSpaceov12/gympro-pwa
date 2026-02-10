import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'e2e-auth-demo.ts',
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:3000',
    video: 'on', // Auto-records each test as a .webm file
    launchOptions: {
      slowMo: 50, // Slight global slowdown for smoother visual
    },
  },
  reporter: [['list']],
});

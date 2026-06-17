import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    browserName: 'firefox',
    viewport: { width: 960, height: 600 },
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    timeout: 10000,
    reuseExistingServer: true,
  },
});

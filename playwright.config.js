const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'off',
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'cd frontend && npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
});

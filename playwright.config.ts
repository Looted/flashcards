import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
        [
      '@zenai/playwright-coding-agent-reporter',
      {
        outputDir: 'test-report-for-coding-agents',
        includeScreenshots: true, // Include screenshots in reports when available
        silent: false, // Show helpful console output
        singleReportFile: true, // All errors in one file
      },
    ],
  ],
  use: {
    baseURL: "http://localhost:4200",
    trace: "on-first-retry",
    screenshot: 'only-on-failure', // This tells Playwright WHEN to take screenshots
    video: 'off', // Turn off video by default for efficiency
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-android",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:4200",
    reuseExistingServer: !process.env.CI,
  },
});

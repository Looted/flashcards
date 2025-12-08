import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  globalSetup: require.resolve("./e2e/global-setup"),
  globalTeardown: require.resolve("./e2e/global-teardown"),
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60000, // Increase from 30s to 60s
  expect: {
    timeout: 10000 // Increase assertion timeout
  },
  reporter: [
        [
      "@zenai/playwright-coding-agent-reporter",
      {
        outputDir: "test-report-for-coding-agents",
        includeScreenshots: true, // Include screenshots in reports when available
        silent: false, // Show helpful console output
        singleReportFile: true, // All errors in one file
      },
    ],
  ],
  use: {
    baseURL: "http://localhost:4200",
    trace: "retain-on-failure",
    screenshot: "only-on-failure", // This tells Playwright WHEN to take screenshots
    video: "retain-on-failure", // Turn off video by default for efficiency
    locale: "en-US", // Force English locale for consistent tests
    timezoneId: "Europe/London", // Set a consistent timezone
    actionTimeout: 15000,
    navigationTimeout: 30000,
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
  webServer: [
    {
      command: "firebase emulators:start --only auth,firestore --project demo-bizzwords",
      port: 9099,
      reuseExistingServer: !process.env.CI || !!process.env.FIREBASE_AUTH_EMULATOR_HOST,
      timeout: 120000, // 2 minutes timeout for emulator startup
    },
    {
      command: "npm run start",
      url: "http://localhost:4200",
      reuseExistingServer: !process.env.CI,
      env: {
        FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
        FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      },
    },
  ],
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "ar-rtl",
      use: {
        ...devices["Desktop Chrome"],
        locale: "ar-EG",
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "en-ltr",
      use: {
        ...devices["Desktop Chrome"],
        locale: "en-US",
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
import { defineConfig, devices } from "@playwright/test";

import { E2E_AUTH_STORAGE_PATH } from "./e2e/helpers/fixture-paths";

/**
 * Local app E2E targets the Next dev server. Qualify Screen 4 specs (CI-8.5) need
 * `npm run dev`, Supabase env, and `E2E_USER_*` — see `e2e/README.md`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "wiring",
      testMatch: /wiring\.spec\.ts/,
    },
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "qualify-e2e",
      testMatch: /qualify-screen-4-company-intel\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: E2E_AUTH_STORAGE_PATH,
      },
      dependencies: ["setup"],
    },
  ],
});

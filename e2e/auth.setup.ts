/**
 * CI-8.5 — Password login for hosted Supabase E2E (saves Playwright storage state).
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { test as setup } from "@playwright/test";

import { loadLocalEnv } from "@/lib/scripts/load-local-env";

import {
  getE2EUserEmail,
  getE2EUserPassword,
  hasQualifyScreen4E2EEnv,
} from "./helpers/env";
import { E2E_AUTH_STORAGE_PATH } from "./helpers/fixture-paths";

loadLocalEnv();

setup.skip(
  !hasQualifyScreen4E2EEnv(),
  "Set E2E_USER_EMAIL, E2E_USER_PASSWORD, and Supabase keys to run qualify E2E",
);

setup("authenticate E2E user", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(getE2EUserEmail());
  await page.getByLabel("Password").fill(getE2EUserPassword());
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(/\/(protected|dashboard)/, { timeout: 30_000 });

  await mkdir(path.dirname(E2E_AUTH_STORAGE_PATH), { recursive: true });
  await page.context().storageState({ path: E2E_AUTH_STORAGE_PATH });
});

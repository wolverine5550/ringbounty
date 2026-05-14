import { test, expect } from "@playwright/test";

/**
 * Smoke wiring: confirms Playwright + Chromium work without starting Next.js.
 * Replace/extend with real navigation against `baseURL` when UI milestones land.
 */
test("playwright can load an in-memory data URL", async ({ page }) => {
  await page.goto(
    "data:text/html;charset=utf-8,<html><head><title>ringbounty-e2e</title></head><body></body></html>",
  );
  await expect(page).toHaveTitle("ringbounty-e2e");
});

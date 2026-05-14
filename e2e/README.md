# End-to-end tests (Playwright)

This folder holds Playwright specs for RingBounty. The first **application-level** flows (auth, number check, payments) will land in later milestones once those surfaces exist in the app.

Until then, `e2e/wiring.spec.ts` only verifies that Playwright can drive Chromium (no local Next.js server required).

## Running E2E tests

1. Install browsers once: `npx playwright install` (or `npx playwright install chromium` for a smaller install).
2. Run: `npm run test:e2e`

For specs that call `page.goto("/")` or other app routes, start the dev server first (`npm run dev`) so `baseURL` in `playwright.config.ts` resolves, or add a [`webServer`](https://playwright.dev/docs/test-webserver) entry to `playwright.config.ts` and supply the same environment variables CI/production would use.

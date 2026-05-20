# End-to-end tests (Playwright)

## Wiring (no server)

`e2e/wiring.spec.ts` verifies Playwright + Chromium without Next.js.

```bash
npx playwright install chromium   # once
npm run test:e2e -- --project=wiring
```

## Qualify Screen 4 — company intelligence UX (CI-8.5)

`e2e/qualify-screen-4-company-intel.spec.ts` covers UNKNOWN numbers on Qualify step 4:

1. **Voicemail CTA** — Lane B completed with no suggestion → primary voicemail prompt (CI-8.2.3).
2. **Agent suggestion** — Lane B `running` + mocked `GET /api/qualify/company-intel` → pre-filled Q13 + confidence badge (CI-8.2.2 / CI-8.2.4).

### Prerequisites

1. `npm run dev` (or set `webServer` in `playwright.config.ts`).
2. `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
3. A **password-enabled** Supabase Auth user (create in Dashboard → Authentication):
   - `E2E_USER_EMAIL`
   - `E2E_USER_PASSWORD`

`e2e/global-setup.ts` seeds a fresh `checking` claim and two subjects via the service role. `e2e/auth.setup.ts` signs in at `/auth/login` and saves `playwright/.auth/user.json` (gitignored).

### Run

```bash
npm run test:e2e -- --project=qualify-e2e
```

Without `E2E_USER_*`, the qualify project tests are skipped (wiring still runs).

# Changelog

## 2026-05-14

- Added `public.claims` and `public.claim_subjects` (PRD columns, FKs, partial unique index for anonymous sessions, `public.set_updated_at` trigger on claims, RLS for `authenticated` ownership / parent-claim inheritance, explicit `GRANT`s) via `supabase/migrations/20260514180200_claims.sql` and `20260514180300_claim_subjects.sql`; applied with Supabase MCP. Added `src/lib/constants/claimSubject.ts` (and unit test) for `call_category` values. Marked Phase 1 §1.5 and §1.6 complete in `task_manager.md`; updated `README.md` table inventory.
- Added `public.violation_types` and `public.users` (FK to `auth.users`, RLS, auth sync trigger, explicit Data API `GRANT`s) via `supabase/migrations/20260514180000_violation_types.sql` and `20260514180100_public_users.sql`; applied to the hosted project with Supabase MCP. Documented Supabase **public schema / Data API** grant rollout (May 30 / Oct 30, 2026) and Security Advisor in `README.md`. Marked Phase 1 §1.3 and §1.4 complete in `task_manager.md`.
- Documented the RingBounty hosted Supabase **project ref** and migration workflow in `README.md` (dashboard SQL Editor apply order; optional `supabase link` + `supabase db push` when CLI is adopted). Added `supabase/migrations/20260514143000_enable_pgcrypto.sql` as the first versioned migration. Removed unused `supabase/config.toml` so the repo does not imply a required local CLI stack.

## 2026-05-13

- Added root app shell (`SiteShell`: header landmark, single `<main>`, global disclaimer footer), RingBounty default metadata, and claim-strength semantic colors (`success`, `warning`, `caution`, `danger`) in `globals.css` / `tailwind.config.ts`. Pointed `components.json` Tailwind CSS path at `src/app/globals.css`. Adjusted home and protected layouts to avoid nested `<main>` elements.
- Added Vitest (`vitest.config.ts`, `npm run test` / `test:watch`), `src/test-utils/mockSupabaseClient.ts` placeholder typed mock, and a smoke unit test for `cn` in `src/lib/utils.test.ts`. Added Playwright (`playwright.config.ts`, `e2e/` with wiring spec and README, `npm run test:e2e`).
- Migrated ESLint to Next.js 16 flat config (`eslint/config` + `eslint-config-next` subpath imports), bumped `eslint-config-next` to 16.2.6, removed unused `@eslint/eslintrc`, fixed `theme-switcher` hydration guard for `react-hooks/set-state-in-effect`, and added GitHub Actions CI for lint, typecheck, and unit tests.
- Pinned `next`, `react`, `react-dom`, `@supabase/supabase-js`, and `@supabase/ssr` to explicit versions; documented Node 20.9+ and environment variables in the README; added `engines.node`; expanded `.gitignore` for Playwright output paths and stopped ignoring `task_manager.md` / `CHANGELOG.md` so they can be versioned; removed unused `SUPABASE_DB` placeholder from `.env.example`.
- Added Husky and lint-staged pre-commit tooling for staged ESLint fixes and full TypeScript checks.

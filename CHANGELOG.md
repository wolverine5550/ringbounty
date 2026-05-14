# Changelog

## 2026-05-13

- Added root app shell (`SiteShell`: header landmark, single `<main>`, global disclaimer footer), RingBounty default metadata, and claim-strength semantic colors (`success`, `warning`, `caution`, `danger`) in `globals.css` / `tailwind.config.ts`. Pointed `components.json` Tailwind CSS path at `src/app/globals.css`. Adjusted home and protected layouts to avoid nested `<main>` elements.
- Added Vitest (`vitest.config.ts`, `npm run test` / `test:watch`), `src/test-utils/mockSupabaseClient.ts` placeholder typed mock, and a smoke unit test for `cn` in `src/lib/utils.test.ts`. Added Playwright (`playwright.config.ts`, `e2e/` with wiring spec and README, `npm run test:e2e`).
- Migrated ESLint to Next.js 16 flat config (`eslint/config` + `eslint-config-next` subpath imports), bumped `eslint-config-next` to 16.2.6, removed unused `@eslint/eslintrc`, fixed `theme-switcher` hydration guard for `react-hooks/set-state-in-effect`, and added GitHub Actions CI for lint, typecheck, and unit tests.
- Pinned `next`, `react`, `react-dom`, `@supabase/supabase-js`, and `@supabase/ssr` to explicit versions; documented Node 20.9+ and environment variables in the README; added `engines.node`; expanded `.gitignore` for Playwright output paths and stopped ignoring `task_manager.md` / `CHANGELOG.md` so they can be versioned; removed unused `SUPABASE_DB` placeholder from `.env.example`.
- Added Husky and lint-staged pre-commit tooling for staged ESLint fixes and full TypeScript checks.

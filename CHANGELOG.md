# Changelog

## 2026-05-13

- Pinned `next`, `react`, `react-dom`, `@supabase/supabase-js`, and `@supabase/ssr` to explicit versions; documented Node 20.9+ and environment variables in the README; added `engines.node`; expanded `.gitignore` for Playwright output paths and stopped ignoring `task_manager.md` / `CHANGELOG.md` so they can be versioned; removed unused `SUPABASE_DB` placeholder from `.env.example`.
- Added Husky and lint-staged pre-commit tooling for staged ESLint fixes and full TypeScript checks.

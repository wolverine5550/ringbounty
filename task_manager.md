# RingBounty — Task Manager (granular)

Living checklist for building RingBounty from `prd.md` and product decisions.  
**Convention:** When a substep is **done**, append to that line: `<!-- done: path/to/file -->`. At the end of each **subsection** (each `###` block under a Phase or under Open questions), complete the **Docs — this subsection** checklist to update `README.md` and `CHANGELOG.md` when appropriate.

---

## Product decisions (locked for v0.1 planning)

| Area | Decision |
|------|----------|
| Auth gate | Users may run checks **without** an account until the **first successful query** (they may have a claim). After that, **account required** to see more. If a query yields **no claim / no results**, they may **try another number** without signing up. |
| Email capture | **Yes** for ineligible / blocked flows (and anywhere else it makes sense). |
| Refunds | **Not in scope for now** — no refund policy in product until decided. |
| Cell vs residential (TCPA subsection) | **Explicit user attestation** only — do not infer from carrier or metadata alone. |
| Demand amount in letter | **User-selectable** option (e.g. conservative / realistic / maximum) with disclaimers; product does not recommend which to choose. |
| Federal DNC / FTC access | **Unknown** — treat as spike; do not assume a specific API until validated. |
| Spam APIs (Nomorobo / YouMail) | **Undecided** — design for **pluggable providers** and possible **single-provider MVP**. |
| OpenCorporates | **Undecided budget** — define caps and fallback UX before heavy usage. |
| Stripe bundles | **Undecided** — choose one Checkout pattern during payments milestone. |
| Stripe Tax | **In scope for v0.1** — enable/configure as part of payments work. |
| Law firm payouts (v0.2) | **Stripe Connect**. |
| Lead billing (v0.2) | **Charge on accept only**. |
| iOS (v1.0) | **Screenshot-only** path acceptable for now. |

---

## Phase 0 — Repo, conventions, and foundations

Husky runs **before every commit** (lint, typecheck, and tests once Vitest exists). Order: complete **§0.0** first, then **§0.1** (includes **first git commit** after hooks pass).

### 0.0 Husky and pre-commit (lint, typecheck, tests)

- [x] **0.0.1** `npm install -D husky lint-staged` (save exact versions in `package-lock.json`). <!-- done: package.json, package-lock.json -->
- [x] **0.0.2** Add `"prepare": "husky"` to root `package.json` so hooks install after `npm install`. <!-- done: package.json -->
- [x] **0.0.3** Run `npx husky init` (creates `.husky/` and a starter `pre-commit`). <!-- done: .husky/pre-commit -->
- [x] **0.0.4** Add `lint-staged` config in `package.json`: e.g. run ESLint on staged `*.{js,jsx,ts,tsx}`; optionally Prettier if the project uses it. <!-- done: package.json -->
- [x] **0.0.5** Edit `.husky/pre-commit` to run `npx lint-staged` then `npm run typecheck` (add `typecheck` script in §0.3 if missing). <!-- done: .husky/pre-commit, package.json -->
- [ ] **0.0.6** After §0.4.5 (first smoke test exists): extend `.husky/pre-commit` to run `npm run test` (full suite; keep fast or scope with `vitest run` paths if the suite grows).
- [x] **0.0.7** Document hooks in `README.md` (what runs on commit, how to skip in emergencies `HUSKY=0` — discourage except for broken WIP). <!-- done: README.md -->
- [x] **0.0.8** Verify a deliberate ESLint error blocks commit; fix and re-commit. <!-- done: .husky/pre-commit -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 0.1 Stack versions, documentation, and first commit

- [x] **0.1.1** Pin `next`, `react`, `react-dom`, `@supabase/supabase-js`, `@supabase/ssr` to explicit semver ranges (avoid bare `"latest"` in `package.json` before production). <!-- done: package.json, package-lock.json -->
- [x] **0.1.2** Document minimum Node.js version in `README.md` (engines field optional in `package.json`). <!-- done: README.md, package.json -->
- [x] **0.1.3** List every required env var **by name** in `README.md` with one-line purpose each (no secret values). <!-- done: README.md -->
- [x] **0.1.4** List optional env vars (feature flags, spam providers, OpenCorporates) in `README.md`. <!-- done: README.md -->
- [x] **0.1.5** Confirm `git` repo initialized; `.gitignore` includes `.env.local`, `node_modules`, `.next`, OS junk, and (if used) Playwright output dirs. <!-- done: .gitignore -->
- [x] **0.1.6** Run `npm install`; run `npm run lint`, `npm run typecheck`, and `npm run test` locally (adjust if test script not yet added — then at minimum lint + typecheck through pre-commit). <!-- done: package.json (includes `npm run test` since §0.4) -->
- [x] **0.1.7** Stage all files intended for the baseline; ensure **no secrets** in the diff (`git diff --staged`). <!-- done: git -->
- [x] **0.1.8** Create the **first commit** with a conventional message, e.g. `chore: initial RingBounty setup with husky pre-commit` — pre-commit hook must **pass** on this commit. <!-- done: git (baseline + hooks: commits 6c3d63c, 3a200fe) -->
- [x] **0.1.9** (Optional) Add remote and push default branch if hosting is ready. <!-- done: git (origin https://github.com/wolverine5550/ringbounty.git) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 0.2 Environment templates

- [ ] **0.2.1** Add `.env.example` at repo root with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] **0.2.2** Add server-only placeholders: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- [ ] **0.2.3** Add `OPENROUTER_API_KEY` (or chosen AI gateway) placeholder.
- [ ] **0.2.4** Add optional: `NOMOROBO_API_KEY`, `YOUMAIL_API_KEY`, `OPENCORPORATES_API_KEY`, `FTC_DNC_*` (or vendor-specific names once spike completes).
- [ ] **0.2.5** Document in `README.md` which vars are client-exposed (`NEXT_PUBLIC_*`) vs server-only.
- [ ] **0.2.6** Ensure `.env.local` remains gitignored; confirm no keys committed.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 0.3 Linting, TypeScript, and build

- [x] **0.3.1** Run `npm run lint` and fix baseline issues across existing files. <!-- done: eslint.config.mjs, package.json, package-lock.json, src/components/theme-switcher.tsx -->
- [x] **0.3.2** Enable `strict` in `tsconfig.json` if not already; resolve new type errors incrementally. <!-- done: tsconfig.json (already strict) -->
- [x] **0.3.3** Add `npm run typecheck` script (`tsc --noEmit`) if desired for CI. <!-- done: package.json -->
- [x] **0.3.4** Run `npm run build`; fix all build-time errors and warnings that block deploy. <!-- done: (verified locally) -->
- [x] **0.3.5** CI: add GitHub Action (or other CI) to run `lint`, `typecheck`, and `test` on PRs — complements Husky; does not replace local pre-commit. <!-- done: .github/workflows/ci.yml -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 0.4 Vitest and unit-test layout

- [x] **0.4.1** Install Vitest + `@vitejs/plugin-react` (or `vitest` + `@testing-library/react` as needed for Next). <!-- done: package.json, package-lock.json -->
- [x] **0.4.2** Add `vitest.config.ts` with path aliases aligned to `tsconfig.json` (`@/` etc.). <!-- done: vitest.config.ts, vite-tsconfig-paths -->
- [x] **0.4.3** Add `npm run test` and `npm run test:watch` scripts to `package.json`. <!-- done: package.json -->
- [x] **0.4.4** Create `src/test-utils/mockSupabaseClient.ts` with typed mocks matching generated `Database` types (stub until types exist). <!-- done: src/test-utils/mockSupabaseClient.ts -->
- [x] **0.4.5** Add one smoke unit test that imports a trivial util to verify Vitest runs in CI. <!-- done: src/lib/utils.test.ts -->

**Assumption (0.4.4 — `mockSupabaseClient`):** `src/test-utils/mockSupabaseClient.ts` is **for unit tests only** (not imported from app or route code). The exported `Database` type is a **stub** until Supabase schema types are generated; then replace it with the real `Database` (e.g. from `supabase gen types typescript`) so mocks stay aligned with the live schema.

**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 0.5 Playwright and E2E placeholder

- [x] **0.5.1** Install `@playwright/test` as devDependency. <!-- done: package.json, package-lock.json -->
- [x] **0.5.2** Add `playwright.config.ts` targeting local `baseURL` (e.g. `http://127.0.0.1:3000`). <!-- done: playwright.config.ts -->
- [x] **0.5.3** Create `/e2e` directory with `.gitkeep` or `README.md` explaining when first E2E lands. <!-- done: e2e/README.md, e2e/wiring.spec.ts -->
- [x] **0.5.4** Add `npm run test:e2e` script (document requirement: dev server running or use `webServer` in config). <!-- done: package.json, e2e/README.md -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 0.6 App shell and design system (baseline)

- [x] **0.6.1** Confirm Shadcn/Tailwind setup (`components.json`, globals) matches project conventions. <!-- done: components.json (tailwind css → src/app/globals.css), src/app/globals.css, tailwind.config.ts -->
- [x] **0.6.2** Add root layout regions: header slot, main, footer slot for global disclaimer. <!-- done: src/app/layout.tsx, src/components/layout/site-shell.tsx; nested layouts: src/app/page.tsx, src/app/protected/layout.tsx (no second <main>) -->
- [x] **0.6.3** Define semantic tokens for success/warning/error states aligned to claim strength UI (green/yellow/orange/red). <!-- done: src/app/globals.css, tailwind.config.ts (success / warning / caution / danger) -->

**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

---

## Phase 1 — Supabase: schema, auth alignment, RLS

### 1.1 Project setup

- [x] **1.1.1** Create Supabase project (hosted) **or** init local Supabase via CLI (`supabase init`, `supabase start`). <!-- done: hosted project (dashboard); no local supabase start required for MVP -->
- [x] **1.1.2** Record project ref / local ports in `README.md` (non-secret). <!-- done: README.md (project ref + API URL; optional CLI ports deferred) -->
- [ ] **1.1.3** Link CLI to project (`supabase link`) if using remote migrations from repo. <!-- deferred: CLI not in use — README documents optional `supabase login` / `supabase link` / `supabase db push` when you adopt the CLI -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 1.2 Migrations workflow

- [x] **1.2.1** Add `supabase/migrations` folder if not present; document naming: `YYYYMMDDHHMMSS_description.sql`. <!-- done: supabase/migrations/, README.md -->
- [x] **1.2.2** Add first migration: enable `pgcrypto` or use `gen_random_uuid()` as supported. <!-- done: supabase/migrations/20260514143000_enable_pgcrypto.sql -->
- [x] **1.2.3** Document in `README.md` how to apply migrations (`supabase db push` / `migration up`). <!-- done: README.md (SQL Editor + optional CLI db push / migration up) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 1.3 `violation_types`

- [x] **1.3.1** Migration: `create table violation_types` per PRD (all columns). <!-- done: supabase/migrations/20260514180000_violation_types.sql; applied via Supabase MCP -->
- [x] **1.3.2** Seed row `tcpa` with `is_active = true` and correct cents / SOL fields. <!-- done: same migration (prd.md seed values) -->
- [x] **1.3.3** Seed inactive rows: `wage_theft`, `data_breach` (or PRD list) with `is_active = false`. <!-- done: same migration -->
- [x] **1.3.4** Add RLS: typically **read-only to authenticated** users for reference data (or public read if safe). <!-- done: RLS + select policy for anon + authenticated (reference catalog); explicit GRANTs for Data API -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md (public schema Data API grants + rollout note) -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 1.4 `users` aligned with Auth

- [x] **1.4.1** Migration: `create table public.users` with `id uuid primary key`, `email unique not null`, `full_name`, `state`, timestamps. <!-- done: supabase/migrations/20260514180100_public_users.sql; applied via Supabase MCP -->
- [x] **1.4.2** Add FK: `public.users.id` references `auth.users(id)` on delete cascade (or document alternative one-way sync). <!-- done: same migration (FK on primary key) -->
- [x] **1.4.3** Implement trigger **or** application hook: on `auth.users` insert/update, upsert `public.users` (email, metadata-derived name). <!-- done: public.sync_auth_user_to_public_users + triggers ringbounty_on_auth_user_created / _updated -->
- [x] **1.4.4** RLS: users can `select`/`update` own row where `id = auth.uid()`; no insert from client if trigger-only. <!-- done: policies users_select_own / users_update_own; GRANT select, update to authenticated only (no insert/delete for client) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 1.5 `claims`

- [x] **1.5.1** Migration: `claims` table per PRD columns + `user_id uuid references public.users(id) on delete cascade` **nullable** for anonymous. <!-- done: supabase/migrations/20260514180200_claims.sql; applied via Supabase MCP -->
- [x] **1.5.2** Add `anonymous_session_id text` (or `uuid`) nullable; unique partial index where `user_id is null` if one active anonymous claim per session is desired. <!-- done: same migration (partial unique on anonymous_session_id where user_id is null) -->
- [x] **1.5.3** Add `status` with `text` + check constraint or Postgres `enum` for: `draft`, `qualified`, `letter_purchased`, `letter_generated`, etc. per PRD. <!-- done: claims_status_check incl. referral path statuses from prd.md -->
- [x] **1.5.4** Indexes: `(user_id)`, `(violation_type)`, `(status)`, `(anonymous_session_id)` where applicable. <!-- done: same migration -->
- [x] **1.5.5** `updated_at` trigger for `claims` (reuse generic trigger pattern). <!-- done: public.set_updated_at() + trigger claims_set_updated_at -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md (claims / claim_subjects listed under Data API) -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 1.6 `claim_subjects`

- [x] **1.6.1** Migration: all PRD columns including `metadata jsonb`, `phone_number_normalized`. <!-- done: supabase/migrations/20260514180300_claim_subjects.sql; applied via Supabase MCP -->
- [x] **1.6.2** FK `claim_id` on delete cascade from `claims`. <!-- done: same migration -->
- [x] **1.6.3** Index `(claim_id)`, `(phone_number_normalized)` for lookups. <!-- done: same migration -->
- [x] **1.6.4** Document `call_category` allowed values in code constant module (sync with PRD exempt list). <!-- done: src/lib/constants/claimSubject.ts (+ claimSubject.test.ts); see prd.md section 6 for exempt screening -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 1.7 `dnc_check_results`

- [x] **1.7.1** Migration: table per PRD; FKs to `claims` and `claim_subjects`. <!-- done: supabase/migrations/20260514180400_dnc_check_results.sql; applied via Supabase MCP -->
- [x] **1.7.2** Index `(claim_id)`, `(claim_subject_id)`. <!-- done: same migration -->
- [x] **1.7.3** Nullable boolean/date fields documented for “not yet run” vs “ran and negative”. <!-- done: SQL COMMENT ON COLUMN on outcome + *_checked_at columns (see migration) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 1.8 `claim_events`

- [x] **1.8.1** Migration: `event_type`, `key`, `value`, `source`, timestamps per PRD. <!-- done: supabase/migrations/20260514180500_claim_events.sql; applied via Supabase MCP (created_at per PRD) -->
- [x] **1.8.2** Index `(claim_id, event_type, created_at)` for timeline queries. <!-- done: claim_events_claim_id_event_type_created_at_idx -->
- [x] **1.8.3** Define TypeScript enums / const maps for `event_type` and `source` strings used by app. <!-- done: src/lib/constants/claimEvent.ts (+ claimEvent.test.ts) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 1.9 `letters`

- [x] **1.9.1** Migration: PRD columns + **`claim_subject_id uuid references claim_subjects(id)`** (or equivalent company grouping FK). <!-- done: supabase/migrations/20260514190900_letters.sql; applied via Supabase MCP -->
- [x] **1.9.2** Add optional `demand_scenario text` — `conservative` | `realistic` | `maximum` to record user choice for letter generation. <!-- done: letters_demand_scenario_check in same migration -->
- [x] **1.9.3** Index `(claim_id)`, `(user_id)`, `(claim_subject_id)`, `(stripe_payment_intent_id)` unique where not null. <!-- done: letters_*_idx + letters_stripe_payment_intent_id_unique partial -->
- [x] **1.9.4** Storage path convention documented: e.g. `letters/{user_id}/{letter_id}.pdf`. <!-- done: README.md (Supabase Storage convention) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 1.10 v0.2 tables (optional early creation)

- [x] **1.10.1** Migration: `law_firms` per PRD (`target_states text[]`, `violation_types text[]`, etc.). <!-- done: supabase/migrations/20260514190600_law_firms.sql; applied via Supabase MCP -->
- [x] **1.10.2** Migration: `firm_users` with `auth_user_id uuid` nullable until linked — prefer over email-only RLS. <!-- done: supabase/migrations/20260514190700_firm_users.sql -->
- [x] **1.10.3** Migration: `leads` per PRD; FKs to `claims`, `users`, `law_firms`. <!-- done: supabase/migrations/20260514190800_leads.sql (+ violation_types FK) -->
- [x] **1.10.4** Default deny RLS on v0.2 tables until features ship. <!-- done: RLS enabled, no policies, GRANTs to authenticated + service_role (Postgres denies until policies added) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 1.11 Row Level Security — policies

- [x] **1.11.1** **Audit** (Security Advisor / `pg_policies`) that RLS stays **on** for: `claims`, `claim_subjects`, `dnc_check_results`, `claim_events`, `letters`, `leads`, `law_firms`, `firm_users`. These tables were already created with **`alter table … enable row level security`** in Phase 1 migrations—this item is **not** a greenfield “turn on RLS only” step. **`letters`** has four `authenticated` owner policies (§1.11.5). **`law_firms`**, **`firm_users`**, and **`leads`** started as §1.10.4 default-deny (RLS on, no policies); **§1.11.6** adds the first `authenticated` **select** policies for firm portal + consumer lead reads (`20260515103000_leads_firm_portal_rls.sql`). <!-- done: audited via Supabase MCP `execute_sql` + dashboard Security Advisor -->
- [x] **1.11.2** `claims`: authenticated users `select`/`update`/`delete` own rows where `user_id = auth.uid()`. <!-- done: supabase/migrations/20260514180200_claims.sql policies `claims_*_own` -->
- [x] **1.11.3** `claims`: **no** broad `insert` for anonymous from client; inserts/updates for anonymous rows only via service role on server. <!-- done: no GRANT to `anon` on claims; only `authenticated` + `service_role` in same migration -->
- [x] **1.11.4** `claim_subjects`, `claim_events`, `dnc_check_results`: inherit access via `claim_id` join to owned `claims` (use subquery policy or security definer views — pick one pattern and document). <!-- done: EXISTS subquery to `claims` in `20260514180300_claim_subjects.sql`, `20260514180500_claim_events.sql`, `20260514180400_dnc_check_results.sql`; README notes subquery pattern -->
- [x] **1.11.5** `letters`: user owns rows where `user_id = auth.uid()`. <!-- done: `letters_*_own` policies in supabase/migrations/20260514190900_letters.sql; verified on hosted DB (4 policies) -->
- [x] **1.11.6** `leads`: consumer `select` own; firms `select` assigned leads — implement via `firm_users.auth_user_id = auth.uid()` join. <!-- done: supabase/migrations/20260515103000_leads_firm_portal_rls.sql (`leads_select_*`, `firm_users_select_self`, `law_firms_select_for_member`); applied via Supabase MCP -->
- [x] **1.11.7** Add Supabase **RLS tests** in Vitest with mock JWT claims (service role vs anon vs authenticated). <!-- done: `src/lib/supabase/rls-smoke.test.ts` — runs when `NEXT_PUBLIC_SUPABASE_*` set; optional `SUPABASE_SERVICE_ROLE_KEY`, `VITEST_SUPABASE_USER_ACCESS_TOKEN` for service-role / user-JWT branches -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md (RLS test env, types regen) -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 1.12 Types and client

- [x] **1.12.1** Run `supabase gen types typescript` into `src/types/database.ts` (or agreed path). <!-- done: `src/types/database.ts` via `npx supabase gen types typescript --project-id nktlhjjeqwpubzlvjpjv` (or Supabase MCP `generate_typescript_types`) -->
- [x] **1.12.2** Export typed `SupabaseClient<Database>` helper from `src/lib/supabase/server.ts` and `client.ts` patterns for App Router. <!-- done: same files + `src/lib/supabase/proxy.ts` -->
- [x] **1.12.3** Update `mockSupabaseClient.ts` to use generated types. <!-- done: `src/test-utils/mockSupabaseClient.ts` imports `Database` from `@/types/database` -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

---

## Phase 2 — Auth, anonymous funnel, and “successful query” gate

### 2.1 Supabase Auth wiring (App Router)

- [x] **2.1.1** Install/configure `@supabase/ssr` middleware for session refresh (`middleware.ts`). <!-- done: Next.js 16 uses root `proxy.ts` + `src/lib/supabase/proxy.ts` calling `createServerClient` + `getClaims()` per Supabase SSR docs (session refresh + cookie sync); no legacy `middleware.ts` in this template -->
- [x] **2.1.2** Create browser client helper (`createBrowserClient`). <!-- done: `src/lib/supabase/client.ts` -->
- [x] **2.1.3** Create server client helpers: `createServerClient` for Server Components; cookie adapter for Route Handlers. <!-- done: `src/lib/supabase/server.ts`; callback route uses `createServerClient` with request/response cookie bridge -->
- [x] **2.1.4** Add `/login` route: email input + “send magic link” button. <!-- done: `src/app/login/page.tsx`, `src/components/magic-link-login-form.tsx` -->
- [x] **2.1.5** Configure Supabase Auth redirect URLs for local + production (`ringbounty.com`). <!-- done: documented in `README.md` (dashboard URL configuration); values set in Supabase project Auth settings — **assumption:** repo/docs only list patterns; every preview/staging origin must be added under **Authentication → URL configuration** or magic links are rejected / land with `?code=` on the wrong path; see README “Auth redirects” + `proxy.ts` PKCE recovery -->
- [x] **2.1.6** Add `/auth/callback` route handler to exchange code for session (PKCE flow as per Supabase docs). <!-- done: `src/app/auth/callback/route.ts` (`exchangeCodeForSession`); distinct from `auth/confirm` token_hash OTP route -->
- [x] **2.1.7** Add sign-out button and clear session cookies. <!-- done: `src/components/logout-button.tsx` (`signOut` + redirect to `/login`) -->
- [x] **2.1.8** Protect authenticated-only routes via layout guard or redirect helper. <!-- done: `src/lib/supabase/require-user.ts` + `await requireUser()` in `src/app/protected/layout.tsx`; `src/lib/supabase/proxy.ts` redirects anonymous users away from non-public routes -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md (Auth / magic link / redirect URLs + §2.1.5 / §2.2 assumptions) -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md — `## 2026-05-14 (Phase 2 — Next.js Suspense + PKCE recovery)` -->

### 2.2 “Successful query” gate — specification

- [x] **2.2.1** Write internal spec doc (short markdown in repo or comment in code): definition of **successful query** until stakeholder finalizes (see Open questions). <!-- done: module-level spec in `src/lib/claims/successful-query.ts` -->
- [x] **2.2.2** Implement pure function `isSuccessfulQuery(claimSnapshot): boolean` in `src/lib/claims/successful-query.ts` (name as needed) with unit tests. <!-- done: same file + `src/lib/claims/successful-query.test.ts` -->
- [x] **2.2.3** Ensure function uses only persisted inputs (spam result, exempt flags, etc.) — no hidden heuristics without tests. <!-- done: `ClaimQuerySnapshot` only exposes `claim_strength`, `is_exempt`, `call_category`, `spam_db_complaint_count`; tests cover branches — **assumption:** `isSuccessfulQuery` is **interim** until the Open questions bullet **“Successful query” exact predicate** (below) is decided; then update `src/lib/claims/successful-query.ts` and `successful-query.test.ts` together -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md (successful query + §2.2 assumption) -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md — `## 2026-05-14 (Phase 2 — Next.js Suspense + PKCE recovery)` -->

**Assumptions / risks (Phase 2.1–2.2 — carry until product locks them):**

- **§2.1.5 / Auth URLs:** In-repo docs describe required **Site URL** and **Additional redirect URLs**; you must still configure every real preview URL in the Supabase dashboard. Missing entries reject magic links or send PKCE `code` to a route that never calls `exchangeCodeForSession`. Prefer **Site URL** = app origin only (e.g. `http://localhost:3000`), not `/protected`, and list `…/auth/callback` explicitly. `proxy.ts` forwards `/` or `/protected` + `?code=` to `/auth/callback` as a safety net.
- **§2.2 / Successful query:** `isSuccessfulQuery` is **interim** until the **“Successful query” exact predicate** open question (Open questions section) is resolved; update module comments, implementation, and Vitest in one pass when stakeholders finalize.

### 2.3 Anonymous session cookie

- [ ] **2.3.1** Generate cryptographically secure `anonymous_session_id` on first visit to `/check` (Route Handler or middleware).
- [ ] **2.3.2** Set HTTP-only, `Secure`, `SameSite=Lax` (or `Strict` where safe) cookie; define max age (e.g. 30 days).
- [ ] **2.3.3** On login: read anonymous id; find draft claim with `user_id is null` and matching session id; run merge (below).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 2.4 Anonymous claim CRUD (server-only)

- [ ] **2.4.1** Route Handler or Server Action: `createOrGetActiveClaimForSession` using service role — returns `claim_id`.
- [ ] **2.4.2** Validate session cookie presence before creating claim; reject forged ids (format check).
- [ ] **2.4.3** Ensure client **never** receives service role key; all anonymous DB writes go through your API.
- [ ] **2.4.4** Unit tests: mock service client verifies correct insert shape.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 2.5 Account wall UX

- [ ] **2.5.1** After check completes: if `isSuccessfulQuery` and no authenticated user, render **Account wall** modal or full page with headline + benefits + CTA to `/login`.
- [ ] **2.5.2** Block navigation to `/results` full detail, `/qualify/*`, `/summary`, `/letter/*` for unauthenticated successful-query state (define exact routes).
- [ ] **2.5.3** If **not** successful query: allow retry another number without login; show gentle copy.
- [ ] **2.5.4** Store minimal state in URL or encrypted query param if needed for deep link post-login (avoid PII in query string).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 2.6 Post-login merge

- [ ] **2.6.1** On first authenticated request after magic link: locate anonymous claim by `anonymous_session_id`.
- [ ] **2.6.2** Transaction: set `claims.user_id = auth.uid()`, clear `anonymous_session_id` (or leave audit trail), attach `public.users` row exists.
- [ ] **2.6.3** Clear anonymous cookie after successful merge.
- [ ] **2.6.4** Handle collision: user already has active claim — define merge vs abandon rules; document in code comment.
- [ ] **2.6.5** Redirect user to appropriate next step (`/results` or per-subject qualify).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 2.7 Rate limiting and abuse

- [ ] **2.7.1** Choose store: Vercel KV, Upstash Redis, or in-DB sliding window per IP + per `anonymous_session_id`.
- [ ] **2.7.2** Implement limit for “check submissions per hour” for anonymous sessions (tune constants later).
- [ ] **2.7.3** Return user-friendly message when limited; log incident server-side.
- [ ] **2.7.4** Optional: CAPTCHA hook after threshold (stub interface if not enabled day one).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 2.8 Email capture (ineligible / blocked)

- [ ] **2.8.1** Design modal: email + optional marketing consent checkbox text reviewed for CAN-SPAM/GDPR where applicable.
- [ ] **2.8.2** Persist to `newsletter_waitlist` table **or** CRM webhook — if no CRM, store table with `source`, `created_at`.
- [ ] **2.8.3** Server-side validate email; dedupe by email hash optional.
- [ ] **2.8.4** Trigger on: ineligible strength, exempt-only results, explicit “notify me” CTA.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 3 — Marketing and legal surface (public)

### 3.1 Landing page `/`

- [ ] **3.1.1** Hero: problem, solution, TCPA framed as informational.
- [ ] **3.1.2** Primary CTA to `/check`; secondary CTA to `/how-it-works`.
- [ ] **3.1.3** Trust strip: “not a law firm”, “estimates not guarantees” one-liner.
- [ ] **3.1.4** Footer with disclaimer + links to privacy/terms.
- [ ] **3.1.5** Basic SEO: `<title>`, meta description, OG image placeholder.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 3.2 `/how-it-works`

- [ ] **3.2.1** Explain flow: check → qualify → pay → letter → file (informational).
- [ ] **3.2.2** TCPA overview without promising outcomes; link to FAQ.
- [ ] **3.2.3** Disclaimer block mid-page or bottom (PRD §3 text).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 3.3 `/faq`

- [ ] **3.3.1** Objection-handling Qs: cost, legality, “will I win”, time to pay, DNC, attorney need.
- [ ] **3.3.2** Each answer ends with non-advice reminder where appropriate.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 3.4 `/privacy`

- [ ] **3.4.1** Plain-English sections: what you collect, why, retention, third parties (Stripe, Supabase, AI vendor), no selling data.
- [ ] **3.4.2** CCPA: how to request deletion/export (mail or form).
- [ ] **3.4.3** Describe anonymous vs authenticated data lifecycle.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 3.5 `/terms`

- [ ] **3.5.1** Terms of service: not legal advice, limitation of liability (lawyer-reviewed draft), acceptable use, age requirement (18+), jurisdiction.
- [ ] **3.5.2** Digital product / letter purchase terms; **no refund** clause matches current product decision or neutral wording.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 3.6 Global disclaimer component

- [ ] **3.6.1** Build `DisclaimerBanner` or footer text component with PRD exact disclaimer string.
- [ ] **3.6.2** Mount on: landing, check, results, qualify, summary, letter, guide, account layouts.
- [ ] **3.6.3** Ensure disclaimer never uses the phrase “legal advice” as offering (PRD §3).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 4 — Evidence checklist and number entry (`/check`)

### 4.1 Route and layout

- [ ] **4.1.1** Create `app/check/page.tsx` (or route group) with mobile-first layout.
- [ ] **4.1.2** Step indicator: “Step 0 — Preserve evidence” before numbers (PRD §10).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 4.2 Evidence checklist UI

- [ ] **4.2.1** Render six checklist items from PRD §10 with checkboxes (local state OK; optional persist to `claim_events` as `evidence_checklist_ack`).
- [ ] **4.2.2** Add supportive copy: “stronger evidence, stronger claim” without guaranteeing outcomes.
- [ ] **4.2.3** “Continue to enter numbers” button disabled until user checks all **or** explicit “I understand, continue anyway” (product choice — pick one and test).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 4.3 Number input UX

- [ ] **4.3.1** Input mask or lib for US phone numbers; strip formatting before API.
- [ ] **4.3.2** “Add number” adds row; “Remove” per row; max count policy (e.g. 10) to prevent abuse.
- [ ] **4.3.3** Duplicate number detection client-side and server-side.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 4.4 Normalization and validation

- [ ] **4.4.1** Implement `normalizeUsPhoneToE164(input): string | null` with tests (NANP, leading 1, etc.).
- [ ] **4.4.2** Reject invalid lengths; show inline error.
- [ ] **4.4.3** Store raw display string optional; always persist `phone_number_normalized`.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 4.5 Persist subjects

- [ ] **4.5.1** On “Run check”: create or load `claims` row for session/user; attach `claim_subjects` rows.
- [ ] **4.5.2** Set initial `claim.status` to `draft` or `checking` if you add intermediate status.
- [ ] **4.5.3** Return `claim_id` and subject ids to client for redirect to results/qualify.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 4.6 Loading and errors

- [ ] **4.6.1** Skeleton UI while checks run; per-number progress if parallel.
- [ ] **4.6.2** Partial failure UX: one provider down, still show other data.
- [ ] **4.6.3** Retry button with backoff; log error codes server-side.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 5 — Spam / exempt pipeline (pluggable)

### 5.1 Types and configuration

- [ ] **5.1.1** Define `SpamCheckResult` interface: `isSpam`, `score`, `complaints`, `category`, `companyName`, `raw`, `providerId`.
- [ ] **5.1.2** Define `SpamCheckProvider` interface: `check(phone: string): Promise<SpamCheckResult>`.
- [ ] **5.1.3** Env-driven flags: `SPAM_PROVIDER_NOMOROBO_ENABLED`, `SPAM_PROVIDER_YOUMAIL_ENABLED` (boolean strings).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 5.2 Nomorobo adapter

- [ ] **5.2.1** Read API docs; implement HTTP client with timeout (e.g. 5s) and typed response mapping.
- [ ] **5.2.2** Map response fields into `SpamCheckResult`; store **full** raw JSON in `claim_events` or `metadata` per PRD.
- [ ] **5.2.3** Unit tests with fixture JSON for spam / non-spam / error responses.
- [ ] **5.2.4** Feature flag: when key missing, adapter returns `isSpam: false` with `raw: { skipped: true }` or skip orchestration step cleanly.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 5.3 YouMail adapter

- [ ] **5.3.1** Same structure as 5.2.x for YouMail-specific schema.
- [ ] **5.3.2** Fixture tests and error handling parity with Nomorobo.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 5.4 Orchestrator

- [ ] **5.4.1** Implement `runSpamChecks(normalizedPhone)` running enabled providers in `Promise.allSettled`.
- [ ] **5.4.2** Merge logic per PRD §7 Step 1: `is_known_spammer`, `confidence_score = max`, `complaint_count = sum`, `category = first non-null OR precedence rule` (document rule).
- [ ] **5.4.3** Write merged outcome to `claim_subjects` columns + `claim_events` rows (`spam_db_match` keys).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 5.5 Exempt category handling

- [ ] **5.5.1** Constant `EXEMPT_CATEGORIES` aligned with PRD §6 table.
- [ ] **5.5.2** If merged `category` in exempt set: set `is_exempt = true`, `exempt_reason`, skip DNC/RA for that subject per PRD.
- [ ] **5.5.3** UI string: neutral message that TCPA may not apply; excluded from estimate (PRD §6).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 5.6 Non-exempt “no spam hit” path

- [ ] **5.6.1** Define UX: still allow qualification **or** soft warning — align with PRD “graceful empty state”.
- [ ] **5.6.2** Adjust scoring inputs when no DB match (matrix uses low-confidence or zero points).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 5.7 FDCPA / debt collection note

- [ ] **5.7.1** If category indicates debt collection, show informational callout: FDCPA may apply; TCPA letter not generated for that subject (or block TCPA path).
- [ ] **5.7.2** Do not promise future product; optional email capture for vertical interest.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 6 — DNC, company ID, registered agent

### 6.1 Federal DNC spike

- [ ] **6.1.1** Research permissible access path (direct FTC, reseller, manual attestation-only MVP).
- [ ] **6.1.2** Document decision in Open questions section + dated note in repo `docs/` if helpful.
- [ ] **6.1.3** If unavailable: UI copy “Federal DNC check unavailable”; scoring must not fabricate positives.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 6.2 Federal DNC integration (when unblocked)

- [ ] **6.2.1** Server-only client; map response into `dnc_check_results` columns.
- [ ] **6.2.2** Parse `federal_dnc_registration_date`; compute `federal_dnc_eligible` using `earliest_call_date` from user input or placeholder until qualification done.
- [ ] **6.2.3** Recompute eligibility when qualification provides `earliest_call_date` (event-driven re-run).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 6.3 State DNC (defer to v0.2 if needed; scaffold optional)

- [ ] **6.3.1** Constants: list of states with registries per PRD §7 Step 4.
- [ ] **6.3.2** If v0.1 ships without state APIs: set `state_dnc_applicable` + nulls + UI “coming soon” or skip.
- [ ] **6.3.3** Abstract `StateDncProvider` interface for future.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 6.4 Company identification

- [ ] **6.4.1** If spam merge yields `company_name`: set `company_identified = true`, store source on subject or events.
- [ ] **6.4.2** If not identified: optional FTC consumer complaint API / scraper spike — behind flag; respect ToS.
- [ ] **6.4.3** If still unknown: set claim subject flag `company_identified = false`; set claim `status` or internal `letter_eligible = false`.
- [ ] **6.4.4** UI prompt Q13 path with blocking message for letter pay (PRD §7 Step 2).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 6.5 Registered agent lookup

- [ ] **6.5.1** OpenCorporates client: search by `company_name` + `user.state`; handle pagination/errors.
- [ ] **6.5.2** If not found in-state: national search fallback (Delaware, etc.).
- [ ] **6.5.3** Persist `registered_agent_name`, `registered_agent_address`, `registered_agent_lookup_source`.
- [ ] **6.5.4** If not found: UI “manual lookup required” + link to static SOS guide for user’s state (top 10 states content task).
- [ ] **6.5.5** Rate limit OpenCorporates calls per session; surface “try again later” when budget exceeded (Open questions).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 6.6 Block letter generation rules

- [ ] **6.6.1** Central function `canPurchaseLetter(claim, subject): { ok: boolean; reasons: string[] }`.
- [ ] **6.6.2** Enforce on server before Stripe Checkout creation (never UI-only).
- [ ] **6.6.3** Unit tests for: exempt, unidentified company, ineligible strength.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 7 — Qualification flow (`/qualify/[id]`)

### 7.1 Routing and state machine

- [ ] **7.1.1** Dynamic route `app/qualify/[claimSubjectId]/page.tsx` (or by claim id + subject index — pick one URL scheme).
- [ ] **7.1.2** Load subject + parent claim; 404 if not owned (post-auth) or invalid session.
- [ ] **7.1.3** Step state: `screen` 1–4 persisted in URL query `?step=` or in `claim_events` for resume.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 7.2 Screen 1 — Consent / EBR

- [ ] **7.2.1** Q1 UI + store `qualification_answer` / `gave_direct_consent` boolean.
- [ ] **7.2.2** Q2 third-party consent UI + storage.
- [ ] **7.2.3** Q3 ongoing relationship UI + storage.
- [ ] **7.2.4** If yes to Q1 or Q3: show PRD explainer modal; write `claim_events` note for letter prompt context.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 7.3 Screen 2 — Stop request / willful

- [ ] **7.3.1** Q4 yes/no → branch.
- [ ] **7.3.2** Q5 method enum mapped to PRD strings (`verbal`, `text_stop`, etc.).
- [ ] **7.3.3** Q6 date picker with validation (not future).
- [ ] **7.3.4** Q7 post-stop calls yes/no.
- [ ] **7.3.5** Write `internal_dnc_*` fields into `dnc_check_results` row and/or `claim_events` consistently.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 7.4 Screen 3 — Call details

- [ ] **7.4.1** Q8 total call count control (slider buckets or numeric input per PRD).
- [ ] **7.4.2** Q9 post-stop count (conditional).
- [ ] **7.4.3** Q10 most recent call date (date picker); used for SOL.
- [ ] **7.4.4** Q11–Q12 time-of-day violations counts.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 7.5 Screen 4 — Company identification assist

- [ ] **7.5.1** Q13 free text; on submit update `claim_subjects.company_name` and `company_identified`.
- [ ] **7.5.2** Q14 evidence yes/no → `claim_events` for future letter/evidence package.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 7.6 Cell vs residential attestation

- [ ] **7.6.1** New question UI: “Was this number calling your mobile phone or a home/landline?” (copy lawyer-reviewed).
- [ ] **7.6.2** Persist choice in `claim_events` (e.g. `line_type` = `mobile` | `residential`).
- [ ] **7.6.3** Map to statute subsections in shared module for letter generation (§227(b)(1)(A)(iii) vs (B)).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 7.7 Completion

- [ ] **7.7.1** On final submit: set `claim.status` to `qualified` (or equivalent); enqueue scoring job or run synchronously if fast.
- [ ] **7.7.2** Redirect to `/results` or `/summary` based on multi-subject flow.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 8 — Scoring, SOL, value display

### 8.1 Strength matrix implementation

- [ ] **8.1.1** Translate PRD §8 table to code constants (points per signal).
- [ ] **8.1.2** Input struct aggregating: spam scores, DNC flags, stop request, time-of-day counts, company ID, RA found, SOL flags, consent negatives, exempt.
- [ ] **8.1.3** Compute total score; apply exempt override → `ineligible`.
- [ ] **8.1.4** Map score to `strong` | `moderate` | `weak` | `ineligible` thresholds.
- [ ] **8.1.5** Unit tests: matrix edge cases (single call, exempt, max points).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 8.2 Statute of limitations

- [ ] **8.2.1** Implement `getStateSolYears(state: string): number` table (defaults + notes in code comments).
- [ ] **8.2.2** Compute `within_federal_sol`, `within_state_sol` from `most_recent_call_date`.
- [ ] **8.2.3** If both false: set `likely_time_barred` flag; UI warning banner; do not hard-block payment per PRD.
- [ ] **8.2.4** Persist SOL flags in `claim_events`.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 8.3 Valuation engine (three scenarios)

- [ ] **8.3.1** Implement PRD §11 formulas: `standard_violation_count`, `willful_violation_count`, `time_violation_count`.
- [ ] **8.3.2** Compute conservative low/high, realistic, maximum in cents; avoid floating point — integers only.
- [ ] **8.3.3** If SOL warning: append caveat string to all displays.
- [ ] **8.3.4** Unit tests with fixed qualification fixtures and expected dollar outputs.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 8.4 Results UI (`/results`)

- [ ] **8.4.1** Per subject card: spam summary, DNC summary, exempt badge, strength badge.
- [ ] **8.4.2** Three-scenario dollar display with labels; mandatory caveat paragraph under numbers (PRD §11).
- [ ] **8.4.3** Strength-specific UI: green/yellow/orange/red; weak → checkbox acknowledgement component before “Continue”.
- [ ] **8.4.4** Ineligible: block pay CTA; show reasons bullet list; offer email capture (Phase 2.8).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 8.5 Persist outputs

- [ ] **8.5.1** Write `claims.claim_strength`, `estimated_*_cents` fields from engine.
- [ ] **8.5.2** Write detailed `claim_events` rows (`value_calculated` keys) for audit trail.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 9 — Summary, bundles, Stripe, Tax

### 9.1 Summary page `/summary`

- [ ] **9.1.1** Group subjects by normalized `company_name` (trim, case-insensitive key).
- [ ] **9.1.2** Per group: show aggregated strength (rule: weakest of group vs strongest — **decide and document**; see Open questions).
- [ ] **9.1.3** Per group CTA: “Get letter for {Company}” → `/letter/[id]` with subject or group id.
- [ ] **9.1.4** Display bundle pricing table when 2+ groups eligible for purchase.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 9.2 Stripe catalog

- [ ] **9.2.1** Create Products in Stripe Dashboard or via API: single letter, 2-bundle, 3-bundle, per-item for 4+.
- [ ] **9.2.2** Store Price IDs in env or `stripe_prices` config module.
- [ ] **9.2.3** Map cart selection to correct Price or custom `price_data` if dynamic.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 9.3 Stripe Tax

- [ ] **9.3.1** Enable Stripe Tax in Dashboard; configure origin address.
- [ ] **9.3.2** Tag products with appropriate `tax_code` for digital goods/services.
- [ ] **9.3.3** Pass `customer_update: { address: 'auto' }` and `automatic_tax: { enabled: true }` in Checkout Session creation.
- [ ] **9.3.4** Test mode: use Stripe test addresses for CA/NY etc.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 9.4 Checkout session creation

- [ ] **9.4.1** Route Handler `POST /api/checkout`: validate auth user owns `claim_id` and subjects in cart.
- [ ] **9.4.2** Re-run `canPurchaseLetter` for each subject in cart.
- [ ] **9.4.3** Create Checkout Session with line items per chosen bundle rules; attach `client_reference_id` = `claim_id`.
- [ ] **9.4.4** Metadata: `claim_id`, comma-separated `claim_subject_ids`, `violation_type`, `demand_scenario` choice.
- [ ] **9.4.5** Success/cancel URLs pointing to `/letter/...` or `/summary` with query flags.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 9.5 Webhooks

- [ ] **9.5.1** Route Handler `POST /api/webhooks/stripe` with raw body + signature verification.
- [ ] **9.5.2** Handle `checkout.session.completed`: idempotent insert into `letters` rows (one per purchased subject).
- [ ] **9.5.3** Store `stripe_payment_intent_id`, `amount_paid_cents` on `letters`.
- [ ] **9.5.4** Handle failures/duplicates with logging + admin alert hook (email/Slack) optional.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 9.6 Demand scenario user choice

- [ ] **9.6.1** Before Checkout: radio buttons `conservative` | `realistic` | `maximum` with disclaimer that product is not recommending a choice.
- [ ] **9.6.2** Pass selected scenario into Checkout metadata and persist on `letters.demand_scenario`.
- [ ] **9.6.3** Show dollar amount preview for selected scenario next to radios (read-only from engine).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 10 — Letter generation, PDF, filing guide, account

### 10.1 Async architecture

- [ ] **10.1.1** Document chosen approach: Vercel `waitUntil`, QStash, Inngest, Supabase Edge Function + cron, or worker.
- [ ] **10.1.2** Implement job record table **or** `letters` status `pending` → `generated` → `failed` with error message.
- [ ] **10.1.3** Retry policy: max N attempts with exponential backoff for OpenRouter/PDF transient errors.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.2 Few-shot corpus

- [ ] **10.2.1** Draft 10 human-written example letters covering varied violation mixes (offline doc OK until checked into secure storage).
- [ ] **10.2.2** Redact PII from examples; store in private bucket or env-injected build secret if needed.
- [ ] **10.2.3** Build prompt assembler that injects 2–3 relevant few-shots by scenario (simple similarity or fixed pairs at first).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.3 OpenRouter integration

- [ ] **10.3.1** Server-only client; configure model name via env.
- [ ] **10.3.2** Build JSON or plain-text prompt sections: user facts, DNC table, RA, subsections list, strength, disclaimers, output format instructions.
- [ ] **10.3.3** Sanitize user free text to reduce prompt injection risk (strip XML-ish tags or escape).
- [ ] **10.3.4** Log token usage per letter for cost tracking.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.4 Output validation

- [ ] **10.4.1** Check letter contains required disclaimer substring and statute citations placeholders filled.
- [ ] **10.4.2** Max length guard; truncate or regenerate once if exceeded.
- [ ] **10.4.3** If validation fails after retries: mark `failed`, notify user with support contact.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.5 PDF generation and storage

- [ ] **10.5.1** Choose PDF strategy: `@react-pdf/renderer`, Puppeteer on serverless (bundle size constraints), or external API.
- [ ] **10.5.2** Render letter HTML/PDF with print stylesheet; embed fonts if needed.
- [ ] **10.5.3** Upload PDF to Supabase Storage bucket `letters` with RLS or signed URLs policy.
- [ ] **10.5.4** Save public/signed URL + `generated_at` on `letters` row.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.6 Letter page `/letter/[id]`

- [ ] **10.6.1** Auth gate; verify `letters.user_id = auth.uid()`.
- [ ] **10.6.2** Show generation spinner when `pending`; error state when `failed`.
- [ ] **10.6.3** Download button uses short-lived signed URL.
- [ ] **10.6.4** Inline disclaimer repeated on page (PRD §13 letter disclaimer + product disclaimer).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.7 Filing guide `/guide`

- [ ] **10.7.1** Gate: only if user has at least one purchased letter for claim (query `letters` + payment state).
- [ ] **10.7.2** Sections 1–7 per PRD §16 as anchor headings + printable layout.
- [ ] **10.7.3** Internal links to USPS certified mail, state small claims URL placeholders.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.8 Account `/account`

- [ ] **10.8.1** List claims with statuses and timestamps.
- [ ] **10.8.2** List letters with download CTA and scenario used.
- [ ] **10.8.3** Link to `/guide` from each letter row.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 11 — SEO, canonical URLs, company pages

### 11.1 URL strategy

- [ ] **11.1.1** Decide canonical company URL pattern; document in `README.md` or `docs/seo.md`.
- [ ] **11.1.2** Implement `next.config` redirects from legacy pattern if PRD alternate URLs were published.
- [ ] **11.1.3** Use `generateMetadata` for dynamic `[company]` route if using template.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 11.2 Core SEO landing pages

- [ ] **11.2.1** `/tcpa-violation-checker` — unique H1, intro, CTA, FAQ schema optional.
- [ ] **11.2.2** `/spam-call-compensation`
- [ ] **11.2.3** `/do-not-call-registry-violation`
- [ ] **11.2.4** `/robocall-lawsuit`
- [ ] **11.2.5** `/tcpa-demand-letter`
- [ ] **11.2.6** Cross-link cluster in footer “Resources”.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 11.3 Company-specific pages (10)

- [ ] **11.3.1** Create content module or MDX per company: CarShield, Sunrun, DirecTV, etc. (PRD list).
- [ ] **11.3.2** Each page: unique first paragraph, structured data `FAQPage` optional, CTA to `/check`.
- [ ] **11.3.3** Avoid unverifiable legal claims; cite general TCPA framing only.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 11.4 Technical SEO

- [ ] **11.4.1** `app/sitemap.ts` returning static + company routes.
- [ ] **11.4.2** `app/robots.ts` allowing production crawl; block staging.
- [ ] **11.4.3** `canonical` URLs in metadata for pages with query variants.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 12 — Observability, abuse, and launch hardening

### 12.1 Logging

- [ ] **12.1.1** Define logger wrapper (`console` in dev, structured JSON in prod or Vercel-friendly).
- [ ] **12.1.2** Log check pipeline stages with correlation id (`claim_id` / `request_id`); **never** log full phone numbers in production (hash last 4 if needed).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 12.2 Monitoring

- [ ] **12.2.1** Integrate Sentry (or similar) for Next.js server + client.
- [ ] **12.2.2** Tag releases with git SHA in Vercel env.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 12.3 Security pass

- [ ] **12.3.1** CSP headers via `next.config` middleware (tune for Stripe/OpenRouter).
- [ ] **12.3.2** Verify `service_role` key only on server routes; grep repo for accidental import in client bundles.
- [ ] **12.3.3** Webhook replay protection: idempotency keys on `letters` creation.
- [ ] **12.3.4** RLS penetration test: attempt cross-user `claim_id` access via forged requests.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 12.4 UX / a11y / mobile

- [ ] **12.4.1** Keyboard navigation on qualify flow; focus management on step change.
- [ ] **12.4.2** Color contrast for strength badges (not color-only — icons/text).
- [ ] **12.4.3** Real-device smoke: iOS Safari + Chrome Android.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 12.5 Launch checklist

- [ ] **12.5.1** Production Supabase: run migrations; verify RLS in dashboard.
- [ ] **12.5.2** Stripe live mode keys isolated; Tax live activation when ready.
- [ ] **12.5.3** Vercel env vars complete; preview env for staging branch optional.
- [ ] **12.5.4** Post-deploy smoke: anonymous check → account wall → magic link → merge → pay test card → PDF download.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 13 — v0.2 (granular high level)

### 13.1 Consumer attorney path

- [ ] **13.1.1** Decision screen branch: “DIY letter” vs “Connect with attorney — free”.
- [ ] **13.1.2** Expectation page: 48h contact, contingency **informational** wording per PRD.
- [ ] **13.1.3** Create `leads` row linked to `claim_id`; status `new`.
- [ ] **13.1.4** Email capture confirmation to user.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 13.2 Evidence PDF for firms

- [ ] **13.2.1** Server job compiling claim_events + screenshots metadata into PDF.
- [ ] **13.2.2** Upload to Storage; save URL on `leads.evidence_pdf_url`.
- [ ] **13.2.3** Redact sensitive third-party PII if required by firm contract (future).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 13.3 Stripe Connect onboarding

- [ ] **13.3.1** Dashboard Connect settings: Standard or Express accounts for firms (decide).
- [ ] **13.3.2** Onboarding link generation for `law_firms` admin user.
- [ ] **13.3.3** Store `stripe_connect_account_id` on firm; webhook `account.updated` for `charges_enabled`.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 13.4 Firm dashboard app

- [ ] **13.4.1** Separate deploy or Next route group `firms.*` subdomain middleware host check.
- [ ] **13.4.2** Firm user auth: map `firm_users.auth_user_id` to Supabase Auth invites.
- [ ] **13.4.3** Lead list view with filters: state, min value, strength.
- [ ] **13.4.4** Supabase Realtime subscription to `leads` insert where `assigned_firm_id` matches (or pool model — align with PRD).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 13.5 Lead accept and payment

- [ ] **13.5.1** “Accept” button: create PaymentIntent with **application fee** or destination charge to firm Connect account per decision.
- [ ] **13.5.2** On `payment_intent.succeeded`: set `leads.status = accepted`, timestamps; unlock consumer PII to firm row visibility policy.
- [ ] **13.5.3** “Decline” flow: status + optional reason; hide from firm list.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 13.6 Firm status updates → user visibility

- [ ] **13.6.1** Firm UI: mark `contacted`, `retained`, `closed` with dates.
- [ ] **13.6.2** RLS allows consumer to read status fields on own lead.
- [ ] **13.6.3** PRD: reminder after 5 days if no status — email cron or Edge scheduled function.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 13.7 State DNC integrations

- [ ] **13.7.1** Per-state spike checklist (IN, TX, WY, CO, LA, MS, MO, OK, OR, PA, TN).
- [ ] **13.7.2** Normalize into `dnc_check_results` fields per state.
- [ ] **13.7.3** Feature flags per state to ship incrementally.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 13.8 Disputes placeholder

- [ ] **13.8.1** In-app “Issue with firm contact” form storing `claim_events` on lead.
- [ ] **13.8.2** Internal admin view (deferred) or email to ops.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 14 — v1.0 native (granular high level)

### 14.1 Android app

- [ ] **14.1.1** Expo project init; shared API client package or monorepo extract.
- [ ] **14.1.2** Request `READ_CALL_LOG` permission flow with rationale screens.
- [ ] **14.1.3** Import call log; normalize numbers; batch server checks with rate limits.
- [ ] **14.1.4** Auto-detect time-of-day violations from timestamps; prefill qualification.
- [ ] **14.1.5** Stripe React Native for in-app purchases mirroring web SKUs.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 14.2 iOS app (screenshot path)

- [ ] **14.2.1** Image picker + upload to signed URL; vision model prompt to extract numbers/dates/counts.
- [ ] **14.2.2** User confirmation step for parsed rows before server persistence.
- [ ] **14.2.3** Reuse same qualification + letter flows via shared screens.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 14.3 Store compliance

- [ ] **14.3.1** Apple App Review notes emphasizing document generation, disclaimers in-app.
- [ ] **14.3.2** Play Data safety form; privacy nutrition labels iOS.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Open questions, undecided nuances, and spikes

Track resolutions here by checking items off and adding `<!-- done: decision recorded in prd.md / elsewhere -->`.

### Definition and product nuance

- [ ] **“Successful query” exact predicate** — Which signals gate the account wall? (Examples: spam DB hit only vs spam + not exempt vs company identified.) Align marketing copy with logic so users are not surprised.
- [ ] **Anonymous attempt limits** — How many numbers per session / per day before soft block or CAPTCHA?
- [ ] **Multi-number in v0.1** — Confirm same-session UX: add list, remove number, re-run checks independently per subject.
- [ ] **Weakest-link vs per-subject strength** — If one number is ineligible and another strong, how does summary read?
- [ ] **Evidence checklist gating** — Require all boxes vs “continue anyway” acknowledgement (Phase 4.2.3 fork).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### Integrations and compliance

- [ ] **Federal DNC / FTC** — Access method still unknown; legal review of ToS for any vendor or government system.
- [ ] **Nomorobo vs YouMail** — One for MVP vs both at launch; pricing and rate limits; storage of raw responses under their ToS.
- [ ] **OpenCorporates** — Pricing tier, monthly cap, behavior when cap hit (queue vs fail vs manual-only).
- [ ] **State DNC APIs** — Per-state reality (API vs scrape vs none); order of rollout.
- [ ] **FTC consumer complaint lookup** — Allowed use for company identification; implementation approach.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### Payments and money

- [ ] **Stripe bundle Checkout structure** — Single line item with metadata vs multiple Prices; impact on refunds later (refunds still “not for now” but structure persists).
- [ ] **Stripe Tax** — Product tax code selection and nexus registration who owns ops (you vs accountant).
- [ ] **Currency** — USD-only for v0.1 assumed; confirm.
- [ ] **Partial bundle completion** — If Checkout succeeds for subset due to race, how to reconcile (unlikely — still decide).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### Letters and liability (product, not legal advice)

- [ ] **User edits after PDF** — Disclaimer coverage for edited downloads.
- [ ] **§227(b)(1)(A)(iii) vs (B)** — Final UX copy for attestation screen (Phase 7.6) without advising outcome.
- [ ] **AI hallucination guardrails** — Human review of first N letters before full automation? (PRD suggests review first 50 outputs.)


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### v0.2 GTM and operations

- [ ] **Lead price** — $200–$500 validation with firms; premium for `strong` only?
- [ ] **Firm outreach timing** — After N paying users (PRD said 10); confirm N.
- [ ] **Chargeback / dispute** when user says firm did not contact after accept payment.
- [ ] **Lead assignment model** — Broadcast to all matching firms vs single round-robin vs exclusive geography.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### v1.0 and roadmap

- [ ] **Monitoring subscription ($9/mo)** — Feature definition deferred; pricing page not needed until scoped.
- [ ] **Class action matching** — PRD open idea; deprioritize until data asset exists.
- [ ] **Canonical SEO slug** — Final decision between `/[company]-spam-calls` and `/[company]-spam-calls-compensation` (ties to Phase 11.1).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### Technical debt / schema notes

- [ ] **“Zero migrations for new verticals”** — Treat as aspirational; still expect migrations for indexes, RLS, and global features.
- [ ] **RLS for anonymous claims** — Must be airtight: only server uses service role to read/write anonymous rows keyed to session.
- [ ] **Letters ↔ company** — Ensure every `letters` row references the intended `claim_subject`(s) or company grouping key for multi-defendant claims.
- [ ] **Connect account type** — Standard vs Express for law firms (Phase 13.3.1).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

*Last updated: Husky + first commit in Phase 0; docs checklists after each subsection. Sync when `prd.md` or decisions change.*

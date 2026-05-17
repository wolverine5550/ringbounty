# RingBounty — Task Manager (granular)

Living checklist for building RingBounty from `prd.md` and product decisions.  
**Convention:** When a substep is **done**, append to that line: `<!-- done: path/to/file -->`. At the end of each **subsection** (each `###` block under a Phase or under Open questions), complete the **Docs — this subsection** checklist to update `README.md` and `CHANGELOG.md` when appropriate.

---

## Strategic pivot (2026-05-17) — evidence + probability + attorney routing

**Removed from v0.1:** DIY **demand letter generation**, Stripe letter Checkout, OpenRouter letter/PDF pipeline, filing guide gated on purchased letters, and consumer-facing “pay for letter” CTAs.

**v0.1 core product loop:**

1. **Gather evidence** — `/check` evidence checklist (Phase 4), qualification facts (Phase 7), optional uploads (federal DNC screenshot §6.2.4, voicemail §7.5.4, Q14 evidence flags).
2. **Show informational case strength** — PRD §8 matrix → `strong` \| `moderate` \| `weak` \| `ineligible` plus SOL/valuation bands on `/results` (Phase 8). Present as **probability / strength language**, not legal advice or guaranteed outcomes.
3. **Route to attorney** — eligible users opt into **free attorney connection** (promoted from old Phase 13.1); firms receive structured lead + evidence package (old 13.2).

**Codebase carryover (do not delete yet):** `letters` table, `/letter/*` routes, `tcpa_letter_blocked` events, and marketing “DIY letter” copy remain until a dedicated cleanup pass updates README, marketing, and constants. New work should **not** extend letter purchase or generation.

**Reprioritized engineering (after §6.5):** §**6.6** `canReferToAttorney` (replaces `canPurchaseLetter`) → Phase **7** qualification → Phase **8** scoring/results → **Phase 13.1–13.2** attorney path + evidence PDF (v0.1). Phases **9–10** cancelled for v0.1 (see banners below).

---

## Product decisions (locked for v0.1 planning)

| Area | Decision |
|------|----------|
| **v0.1 primary outcome** | **Evidence gathering** + **informational claim strength / probability** + **attorney referral** — not DIY demand letters. |
| Auth gate | Users may run checks **without** an account until the **first successful query** (they may have a claim). After that, **account required** to see more. If a query yields **no claim / no results**, they may **try another number** without signing up. |
| Email capture | **Yes** for ineligible / blocked flows (and anywhere else it makes sense). |
| Refunds | **Not in scope for now** — no consumer letter product in v0.1. |
| Cell vs residential (TCPA subsection) | **Explicit user attestation** only — do not infer from carrier or metadata alone. Stored for **scoring + attorney evidence package**, not letter subsection selection. |
| DIY demand letters | **Out of scope v0.1** — no generation, PDF, Stripe letter SKUs, or `/letter` purchase flow. Legacy schema/UI may remain until cleanup. |
| Demand / valuation display | **Informational only** on `/results` — conservative / realistic / maximum **estimate bands** (PRD §11) to help users and attorneys understand scale; product does not recommend a demand amount. |
| Attorney referral | **In scope v0.1** — “Connect with an attorney — free” after qualification + strength gate; creates `leads` row (see Phase 13.1, promoted). |
| Consumer Stripe (letters) | **Cancelled v0.1** — old Phase 9. Firm-side Connect remains v0.2 (Phase 13.3+). |
| Federal DNC / FTC access | **Manual attestation** (qualification) — user attests yes/no + registration date after self-check at [donotcall.gov](https://www.donotcall.gov) (FTC confirmation email has date); optional screenshot of that email (§6.2.4). **No** Registry API/SAN/vendor scrub unless counsel approves ([Q&A #13](https://www.ftc.gov/business-guidance/resources/qa-telemarketers-sellers-about-dnc-provisions-tsr-0)). Spike: [`docs/spikes/20260516190000-federal-dnc-access.md`](docs/spikes/20260516190000-federal-dnc-access.md). |
| Spam / reputation (Nomorobo + Twilio) | **Decided** — **Nomorobo Enterprise** primary (`GET /v2/check`); **Twilio Lookup v2** secondary (§5.2). YouMail **not** in v0.1. |
| OpenCorporates | **In use** (§6.5 RA lookup, §7.5.1b soft verify) — caps via `opencorporates_lookup` rate limit; SOS manual fallback UX. |
| Stripe Tax | **Deferred** with consumer letter Checkout (old Phase 9). |
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
- [ ] **0.2.2** Add server-only placeholders: `SUPABASE_SECRET_KEY` (preferred; legacy `SUPABASE_SERVICE_ROLE_KEY` fallback), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- [ ] **0.2.3** Add `OPENROUTER_API_KEY` (or chosen AI gateway) placeholder.
- [ ] **0.2.4** Add optional: `NOMOROBO_API_KEY` (§5.3), `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (§5.2 Lookup), `OPENCORPORATES_API_KEY`, `FTC_DNC_*` (or vendor-specific names once spike completes).
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

### 1.9 `letters` *(schema retained; consumer letter product cancelled v0.1)*

- [x] **1.9.1** Migration: PRD columns + **`claim_subject_id uuid references claim_subjects(id)`** (or equivalent company grouping FK). <!-- done: supabase/migrations/20260514190900_letters.sql; applied via Supabase MCP — table unused for v0.1 MVP -->
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
- [x] **1.11.7** Add Supabase **RLS tests** in Vitest with mock JWT claims (service role vs anon vs authenticated). <!-- done: `src/lib/supabase/rls-smoke.test.ts` — runs when `NEXT_PUBLIC_SUPABASE_*` set; optional `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`), `VITEST_SUPABASE_USER_ACCESS_TOKEN` for admin / user-JWT branches -->


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

- [x] **2.3.1** Generate cryptographically secure `anonymous_session_id` on first visit to `/check` (Route Handler or middleware). <!-- done: mint in `src/lib/supabase/proxy.ts` on `/check` using `crypto.randomUUID()`; placeholder UI `src/app/check/page.tsx` -->
- [x] **2.3.2** Set HTTP-only, `Secure`, `SameSite=Lax` (or `Strict` where safe) cookie; define max age (e.g. 30 days). <!-- done: `src/lib/anonymous-session.ts` (`getAnonymousSessionCookieOptions`); `Secure` only when `NODE_ENV === "production"` for local HTTP -->
- [x] **2.3.3** On login: read anonymous id; find draft claim with `user_id is null` and matching session id; run merge (below). <!-- done: `mergeAnonymousDraftOnLogin` from `src/app/auth/callback/route.ts` after `exchangeCodeForSession`; clears `rb_anonymous_sid` on success — §2.6 for collision UX -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md “Anonymous funnel” -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md `## 2026-05-14 (Phase 2.3–2.4 …)` -->

### 2.4 Anonymous claim CRUD (server-only)

- [x] **2.4.1** Route Handler or Server Action: `createOrGetActiveClaimForSession` using service role — returns `claim_id`. <!-- done: `src/lib/claims/create-or-get-active-claim-for-session.ts` + `POST` `src/app/api/claims/anonymous/route.ts` -->
- [x] **2.4.2** Validate session cookie presence before creating claim; reject forged ids (format check). <!-- done: `isValidAnonymousSessionId` in `src/lib/anonymous-session.ts`; used by API route -->
- [x] **2.4.3** Ensure client **never** receives service role key; all anonymous DB writes go through your API. <!-- done: `src/lib/supabase/admin.ts` server-only (`SUPABASE_SECRET_KEY`); no `NEXT_PUBLIC_*` -->
- [x] **2.4.4** Unit tests: mock service client verifies correct insert shape. <!-- done: `src/lib/claims/create-or-get-active-claim-for-session.test.ts` -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md “Anonymous funnel” + testing pointers -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md `## 2026-05-14 (Phase 2.3–2.4 …)` -->

### 2.5 Account wall UX

- [x] **2.5.1** After check completes: if `isSuccessfulQuery` and no authenticated user, render **Account wall** modal or full page with headline + benefits + CTA to `/login`. <!-- done: `src/components/account-wall.tsx` — **TODO (pivot §3.7.3):** update benefits copy away from demand letter purchase -->
- [x] **2.5.2** Block navigation to `/results` full detail, `/qualify/*`, `/summary`, `/letter/*` for unauthenticated successful-query state (define exact routes). <!-- done: `src/lib/claims/gated-routes.ts`, `src/lib/claims/enforce-post-check-access.ts`, `src/app/(post-check)/**`, `src/lib/supabase/proxy.ts` (`isAnonymousAllowedPath`) -->
- [x] **2.5.3** If **not** successful query: allow retry another number without login; show gentle copy. <!-- done: `CheckOutcomePanel` + `/check?retry=1` redirect from enforce guard -->
- [x] **2.5.4** Store minimal state in URL or encrypted query param if needed for deep link post-login (avoid PII in query string). <!-- done: `claim` + `returnTo` query params only (`buildLoginHrefForClaim`, `buildAccountRequiredHref`) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 2.6 Post-login merge

- [x] **2.6.1** On first authenticated request after magic link: locate anonymous claim by `anonymous_session_id`. <!-- done: `mergeAnonymousDraftOnLogin` in `src/lib/claims/merge-anonymous-draft-on-login.ts` -->
- [x] **2.6.2** Transaction: set `claims.user_id = auth.uid()`, clear `anonymous_session_id` (or leave audit trail), attach `public.users` row exists. <!-- done: sequential admin updates + `ensurePublicUserRow` (auth trigger fallback via `auth.admin.getUserById`); **assumption:** future RPC for true DB transaction -->
- [x] **2.6.3** Clear anonymous cookie after successful merge. <!-- done: `src/app/auth/callback/route.ts` -->
- [x] **2.6.4** Handle collision: user already has active claim — define merge vs abandon rules; document in code comment. <!-- done: abandon anonymous draft when user already owns a `draft` claim — see module docstring in `merge-anonymous-draft-on-login.ts` + Vitest -->
- [x] **2.6.5** Redirect user to appropriate next step (`/results` or per-subject qualify). <!-- done: `resolvePostMergeRedirectPath` in `src/lib/claims/post-merge-redirect.ts` + callback -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

**Assumptions / risks (Phase 2.6 — carry until hardened):**

- **§2.6.2 / Merge atomicity:** `mergeAnonymousDraftOnLogin` runs **sequential admin client calls**, not a single Postgres transaction. A partial failure could leave inconsistent state (e.g. `public.users` upserted but claim not attached). Documented in `src/lib/claims/merge-anonymous-draft-on-login.ts`. **Follow-up:** add a timestamped migration with an RPC (e.g. `merge_anonymous_claim_on_login`) that wraps locate → collision check → attach/abandon in `BEGIN … COMMIT`.

### 2.7 Rate limiting and abuse

- [x] **2.7.1** Choose store: Vercel KV, Upstash Redis, or in-DB sliding window per IP + per `anonymous_session_id`. <!-- done: in-DB `public.rate_limit_buckets` + `consume_rate_limit` RPC — `supabase/migrations/20260515120000_rate_limit_and_newsletter_waitlist.sql` -->
- [x] **2.7.2** Implement limit for “check submissions per hour” for anonymous sessions (tune constants later). <!-- done: `src/lib/rate-limit/constants.ts` (10/session, 30/IP), `assertCheckSubmissionAllowed`, `POST` `src/app/api/check/submit/route.ts` -->
- [x] **2.7.3** Return user-friendly message when limited; log incident server-side. <!-- done: `RateLimitExceededError`, `logRateLimitIncident`, 429 in check submit + waitlist routes -->
- [x] **2.7.4** Optional: CAPTCHA hook after threshold (stub interface if not enabled day one). <!-- done: `src/lib/rate-limit/captcha.ts` (`noopCaptchaVerifier`, `requiresCaptcha` stub) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

**Assumptions / risks (Phase 2.7 — carry until tuned):**

- **Store:** In-DB counters (no Redis/KV) — sufficient for MVP; revisit if hot-path latency matters.
- **Check submit:** Phase 4 pipeline should call `assertCheckSubmissionAllowed` before expensive work; preview button on `/check` calls `POST /api/check/submit` today.
- **Limits:** Defaults are interim until **Anonymous attempt limits** open question is resolved.

### 2.8 Email capture (ineligible / blocked)

- [x] **2.8.1** Design modal: email + optional marketing consent checkbox text reviewed for CAN-SPAM/GDPR where applicable. <!-- done: `src/components/email-capture-modal.tsx` + placeholder copy `src/lib/waitlist/constants.ts` — **legal review pending** -->
- [x] **2.8.2** Persist to `newsletter_waitlist` table **or** CRM webhook — if no CRM, store table with `source`, `created_at`. <!-- done: `public.newsletter_waitlist`, `src/lib/waitlist/subscribe-waitlist.ts`, `POST` `src/app/api/waitlist/route.ts` -->
- [x] **2.8.3** Server-side validate email; dedupe by email hash optional. <!-- done: `src/lib/waitlist/validate-email.ts`, `hash-email.ts`, unique on `email_hash` -->
- [x] **2.8.4** Trigger on: ineligible strength, exempt-only results, explicit “notify me” CTA. <!-- done: `getEmailCaptureTrigger`, status API fields, `CheckOutcomePanel` + notify overlay -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

**Assumptions / risks (Phase 2.8 — carry until product/legal lock):**

- **Consent copy:** Placeholder only — replace `MARKETING_CONSENT_*` in `src/lib/waitlist/constants.ts` after CAN-SPAM/GDPR review.
- **Exempt-only:** All `claim_subjects` rows `is_exempt = true` triggers capture; mixed exempt/non-exempt does not.

---

## Phase 3 — Marketing and legal surface (public)

### 3.1 Landing page `/`

- [x] **3.1.1** Hero: problem, solution, TCPA framed as informational. <!-- done: src/components/marketing/landing-hero.tsx, src/app/page.tsx -->
- [x] **3.1.2** Primary CTA to `/check`; secondary CTA to `/how-it-works`. <!-- done: landing-hero.tsx -->
- [x] **3.1.3** Trust strip: “not a law firm”, “estimates not guarantees” one-liner. <!-- done: src/components/marketing/trust-strip.tsx, src/lib/marketing/constants.ts -->
- [x] **3.1.4** Footer with disclaimer + links to privacy/terms. <!-- done: src/components/marketing/marketing-page-footer.tsx (+ FAQ link; privacy/terms pages ship §3.4–3.5) -->
- [x] **3.1.5** Basic SEO: `<title>`, meta description, OG image placeholder. <!-- done: metadata in src/app/page.tsx (uses /opengraph-image.png) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 3.2 `/how-it-works`

- [x] **3.2.1** Explain flow: check → qualify → pay → letter → file (informational). <!-- done: src/app/how-it-works/page.tsx — **TODO (pivot):** rewrite to check → qualify → results/strength → connect with attorney -->
- [x] **3.2.2** TCPA overview without promising outcomes; link to FAQ. <!-- done: same page → /faq -->
- [x] **3.2.3** Disclaimer block mid-page or bottom (PRD §3 text). <!-- done: src/components/marketing/disclaimer-block.tsx -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 3.3 `/faq`

- [x] **3.3.1** Objection-handling Qs: cost, legality, “will I win”, time to pay, DNC, attorney need. <!-- done: src/lib/marketing/faq.ts, src/app/faq/page.tsx, src/components/marketing/faq-list.tsx -->
- [x] **3.3.2** Each answer ends with non-advice reminder where appropriate. <!-- done: FAQ_NON_ADVICE_REMINDER in src/lib/marketing/non-advice-reminder.ts; faq.test.ts -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 3.4 `/privacy`

- [x] **3.4.1** Plain-English sections: what you collect, why, retention, third parties (Stripe, Supabase, AI vendor), no selling data. <!-- done: src/lib/marketing/privacy.ts, src/app/privacy/page.tsx -->
- [x] **3.4.2** CCPA: how to request deletion/export (mail or form). <!-- done: privacy@ringbounty.com CCPA section in privacy.ts -->
- [x] **3.4.3** Describe anonymous vs authenticated data lifecycle. <!-- done: privacy.ts lifecycle section -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 3.5 `/terms`

- [x] **3.5.1** Terms of service: not legal advice, limitation of liability (lawyer-reviewed draft), acceptable use, age requirement (18+), jurisdiction. <!-- done: src/lib/marketing/terms.ts, src/app/terms/page.tsx -->
- [x] **3.5.2** Digital product / letter purchase terms; **no refund** clause matches current product decision or neutral wording. <!-- done: terms.ts — **TODO (pivot):** remove or replace letter-purchase terms with attorney-referral / lead-sharing language -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 3.6 Global disclaimer component

- [x] **3.6.1** Build `DisclaimerBanner` or footer text component with PRD exact disclaimer string. <!-- done: src/components/marketing/disclaimer-banner.tsx; DisclaimerBlock wraps it -->
- [x] **3.6.2** Mount on: landing, check, results, qualify, summary, letter, guide, account layouts. <!-- done: SiteShell footer, marketing pages, src/app/check/layout.tsx, src/app/(post-check)/layout.tsx, protected-shell-with-auth.tsx; /guide layout deferred to Phase §10.7 -->
- [x] **3.6.3** Ensure disclaimer never uses the phrase “legal advice” as offering (PRD §3). <!-- done: constants.test.ts -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 3.7 Product copy pivot — no DIY demand letters *(2026-05-17)*

- [ ] **3.7.1** Landing + hero + how-it-works: replace “DIY demand letter” / “pay for letter” with evidence → strength → attorney referral ([`landing-content.ts`](src/lib/marketing/landing-content.ts), [`landing-hero.tsx`](src/components/marketing/landing-hero.tsx), [`how-it-works`](src/app/how-it-works/page.tsx)).
- [ ] **3.7.2** FAQ: remove paid-letter pricing answers; add attorney-referral expectations ([`faq.ts`](src/lib/marketing/faq.ts)).
- [ ] **3.7.3** [`account-wall.tsx`](src/components/account-wall.tsx) + [`check/page.tsx`](src/app/check/page.tsx): benefits list — qualify + see strength + connect with attorney (not “purchase a demand letter”).
- [ ] **3.7.4** Privacy/terms: lead-sharing with law firms; remove digital letter product sections where obsolete.
- [ ] **3.7.5** README + CHANGELOG entry when copy pivot ships.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 4 — Evidence checklist and number entry (`/check`)

### 4.1 Route and layout

- [x] **4.1.1** Create `app/check/page.tsx` (or route group) with mobile-first layout. <!-- done: src/app/check/page.tsx, src/components/check/check-page-shell.tsx, src/app/check/layout.tsx (padding) -->
- [x] **4.1.2** Step indicator: “Step 0 — Preserve evidence” before numbers (PRD §10). <!-- done: src/components/check/check-step-indicator.tsx, src/lib/check/constants.ts -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 4.2 Evidence checklist UI

- [x] **4.2.1** Render six checklist items from PRD §10 with checkboxes (local state OK; optional persist to `claim_events` as `evidence_checklist_ack`). <!-- done: src/lib/check/evidence-checklist-items.ts, src/components/check/check-funnel-client.tsx — persist deferred: anonymous funnel + RLS on claim_events is authenticated-only today -->
- [x] **4.2.2** Add supportive copy: “stronger evidence, stronger claim” without guaranteeing outcomes. <!-- done: CHECK_EVIDENCE_CHECKLIST_SUPPORT_COPY in src/lib/check/evidence-checklist-items.ts -->
- [x] **4.2.3** “Continue to enter numbers” button disabled until user checks all **or** explicit “I understand, continue anyway” (product choice — pick one and test). <!-- done: canContinueToNumberEntry in src/lib/check/evidence-checklist-gate.ts + Vitest src/lib/check/evidence-checklist.test.ts; UI in check-funnel-client.tsx -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 4.3 Number input UX

- [x] **4.3.1** Input mask or lib for US phone numbers; strip formatting before API. <!-- done: `formatUsPhoneMask` + `extractUsPhoneDigits` in src/lib/check/us-phone.ts; Step 1 inputs in src/components/check/check-funnel-client.tsx; JSON body uses digit strings -->
- [x] **4.3.2** “Add number” adds row; “Remove” per row; max count policy (e.g. 10) to prevent abuse. <!-- done: CHECK_MAX_PHONE_ROWS = 10 in src/lib/check/constants.ts -->
- [x] **4.3.3** Duplicate number detection client-side and server-side. <!-- done: computeDuplicateRowIds in check-funnel-client.tsx; parseAndDedupePhoneNumberPayload in us-phone.ts + POST /api/check/submit -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 4.4 Normalization and validation

- [x] **4.4.1** Implement `normalizeUsPhoneToE164(input): string | null` with tests (NANP, leading 1, etc.). <!-- done: src/lib/check/us-phone.ts, src/lib/check/us-phone.test.ts -->
- [x] **4.4.2** Reject invalid lengths; show inline error. <!-- done: rowValidityHint + digitLengthIssue in src/components/check/check-funnel-client.tsx; server rejects via parseAndDedupePhoneNumberPayload -->
- [x] **4.4.3** Store raw display string optional; always persist `phone_number_normalized`. <!-- done: POST /api/check/submit + phone_displays → claim_subjects.phone_number / phone_number_normalized (service role) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 4.5 Persist subjects

- [x] **4.5.1** On “Run check”: create or load `claims` row for session/user; attach `claim_subjects` rows. <!-- done: `createOrGetActiveClaimForSession` + `replaceClaimSubjectsForPhones` in `src/app/api/check/submit/route.ts` -->
- [x] **4.5.2** Set initial `claim.status` to `draft` or `checking` if you add intermediate status. <!-- done: migration `supabase/migrations/20260515160000_claims_status_checking.sql`; anonymous claim stays `draft` until first phone persist, then `checking` via `src/app/api/check/submit/route.ts`; `ANONYMOUS_FUNNEL_ACTIVE_STATUSES` in `src/lib/claims/anonymous-funnel-claim-status.ts` -->
- [x] **4.5.3** Return `claim_id` and subject ids to client for redirect to results/qualify. <!-- done: JSON `claim_subject_ids` (order matches request) from `POST /api/check/submit`; client still stays on `/check` until post-check auth/gate lines up with Phase 5+ -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 4.6 Loading and errors

- [x] **4.6.1** Skeleton UI while checks run; per-number progress if parallel. <!-- done: per-row skeleton + parallel copy in `check-funnel-client.tsx` while `/api/check/submit` runs; numbers run in parallel via `runStubChecksForPhoneList` -->
- [x] **4.6.2** Partial failure UX: one provider down, still show other data. <!-- done: `number_checks[].providers` per-outcome UI; HTTP 200 when persist succeeds; `parallel-check-pipeline-stub.ts` + tests with `failProviderId` -->
- [x] **4.6.3** Retry button with backoff; log error codes server-side. <!-- done: **Retry with backoff** (`checkSubmitRetryBackoffMs`) in `check-funnel-client.tsx`; `console.error` JSON `{ event, error_code, … }` in `parallel-check-pipeline-stub.ts` + `check_submit_unhandled` in submit route -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

**§4.6 — Risks / follow-ups (stubs interim)**
- The parallel “providers” in [`src/lib/check/parallel-check-pipeline-stub.ts`](src/lib/check/parallel-check-pipeline-stub.ts) (**`runStubChecksForPhoneList`**) are **placeholder until Phase 5**: they **always succeed in production** unless you later wire env-driven failure for staging. Phase 5 should **replace** `runStubChecksForPhoneList` with real adapters but **can keep the same `number_checks` shape**.
- Per-number **“progress” is honest loading** (skeleton until the single response returns), **not streaming** — fine until you add SSE or split requests.

---

## Phase 5 — Spam / exempt pipeline (pluggable)

**Bridge from §4.6:** Replace stub `runStubChecksForPhoneList` with **Nomorobo** (primary) + **Twilio Lookup v2** (secondary) via orchestration (§5.4). Preserve **`number_checks`** (or evolve it minimally) unless product changes the API contract.

### 5.1 Types and configuration

- [x] **5.1.1** Define `SpamCheckResult` interface: `isSpam`, `score`, `complaints`, `category`, `companyName`, `raw`, `providerId`. <!-- done: src/lib/spam/types.ts -->
- [x] **5.1.2** Define `SpamCheckProvider` interface: `check(phone: string): Promise<SpamCheckResult>`. <!-- done: src/lib/spam/types.ts -->
- [x] **5.1.3** Env-driven flags: `SPAM_PROVIDER_NOMOROBO_ENABLED`, `SPAM_PROVIDER_TWILIO_ENABLED` (boolean strings). <!-- done: src/lib/spam/provider-flags.ts + src/lib/spam/provider-flags.test.ts; `.env.example` -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md — planned integrations -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 5.2 Twilio adapter (secondary — phone intelligence + corroboration)

> **Wire protocol:** [**Twilio Lookup v2**](https://www.twilio.com/docs/lookup/v2-api) — `Fields=phone_number_quality_score,caller_name,line_type_intelligence` (see [PRD §7](prd.md)). **Secondary** to Nomorobo (§5.3).

- [x] **5.2.1** Read API docs; implement HTTP client with timeout (e.g. 5s) and typed response mapping. <!-- done: `src/lib/spam/twilio-lookup-spam-provider.ts`; originally v1, migrated in 5.2.5 -->
- [x] **5.2.2** Map response fields into `SpamCheckResult`; store **full** raw JSON in `claim_events` or `metadata` per PRD. <!-- done: `mapTwilioLookupV2JsonToSpamCheckResult` + `raw: body`; **persistence** still §5.4 -->
- [x] **5.2.3** Unit tests with fixture JSON for spam / non-spam / error responses. <!-- done: `src/lib/spam/twilio-lookup-spam-provider.test.ts` -->
- [x] **5.2.4** Feature flag: when key missing, adapter returns `isSpam: false` with `raw: { skipped: true }` or skip orchestration step cleanly. <!-- done: `skippedResult` when `!enabled` or missing sid/token; orchestration §5.4 -->
- [x] **5.2.5** **Migrate to Lookup v2** (replace v1 `nomorobo_spamscore` add-on path). <!-- done: v2 base URL + `TWILIO_LOOKUP_V2_FIELDS`; Vitest updated -->
- [x] **5.2.6** Document **quality score → `isSpam`** threshold (`TWILIO_QUALITY_SPAM_THRESHOLD` = 80, PRD §8 high-confidence band) in code + tests. <!-- done: `twilio-lookup-spam-provider.ts` + tests -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md planned integrations -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md Phase 5.2 + v2 migration entry -->

### 5.3 Nomorobo adapter (primary — spam / robocall reputation)

> **Wire protocol:** Nomorobo Enterprise **`GET https://api.nomorobo.com/v2/check`** (`X-API-Key`). Docs: `docs/Nomorobo Enterprise API Documentation.pdf`, [nomorobo.com/api](https://www.nomorobo.com/api/).

- [x] **5.3.0** **Spike:** Review Enterprise PDF + public API page; confirm `From` / optional `To`, `risk_score`, `number_of_calls`, `reported_category`, `reported_name`. <!-- done: docs/Nomorobo Enterprise API Documentation.pdf -->
- [x] **5.3.1** Implement `nomorobo-spam-provider.ts`: HTTP client (5s timeout), map `/check` JSON → `SpamCheckResult`, skip when flag off or key missing. <!-- done: src/lib/spam/nomorobo-spam-provider.ts -->
- [x] **5.3.2** Fixture tests (high risk / low risk / HTTP error / skip paths). <!-- done: src/lib/spam/nomorobo-spam-provider.test.ts -->
- [x] **5.3.3** Map `risk_score` → `isSpam` (threshold 80), `number_of_calls` → `complaints`, `reported_category` → `call_category`, `reported_name` → `companyName`; store full `raw`. <!-- done: mapNomoroboCheckJsonToSpamCheckResult -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 5.4 Orchestrator

- [x] **5.4.1** Implement `runSpamChecks(normalizedPhone)` running enabled providers in `Promise.allSettled`. <!-- done: src/lib/spam/run-spam-checks.ts, run-spam-checks.test.ts -->
- [x] **5.4.2** Merge logic per PRD §7 Step 1: `is_known_spammer`, `confidence_score = max`, `complaint_count = sum`, `category = first non-null OR precedence rule` (document rule). <!-- done: src/lib/spam/merge-spam-results.ts (Nomorobo-first category/company; OR isSpam; max/sum), merge-spam-results.test.ts -->
- [x] **5.4.3** Write merged outcome to `claim_subjects` columns + `claim_events` rows (`spam_db_match` keys). <!-- done: src/lib/spam/persist-spam-check-outcome.ts; wired from src/lib/spam/spam-check-pipeline.ts → POST /api/check/submit -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 5.5 Exempt category handling

- [x] **5.5.1** Constant `EXEMPT_CATEGORIES` aligned with PRD §6 table. <!-- done: src/lib/constants/exempt-categories.ts (+ exempt-categories.test.ts); EBR excluded (qualification-only) -->
- [x] **5.5.2** If merged `category` in exempt set: set `is_exempt = true`, `exempt_reason`, skip DNC/RA for that subject per PRD. <!-- done: resolveExemptFromCallCategory in merge-spam-results.ts; persist is_exempt/exempt_reason in persist-spam-check-outcome.ts; downstream Phase 6 should gate on is_exempt -->
- [x] **5.5.3** UI string: neutral message that TCPA may not apply; excluded from estimate (PRD §6). <!-- done: EXEMPT_TCPA_USER_MESSAGE in exempt-categories.ts; per-number display in check-funnel-client.tsx; number_checks.is_exempt from spam-check-pipeline.ts -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 5.6 Non-exempt “no spam hit” path

- [x] **5.6.1** Define UX: still allow qualification **or** soft warning — align with PRD “graceful empty state”. <!-- done: soft warning only (qualification allowed) — NO_SPAM_HIT_USER_MESSAGE in src/lib/constants/no-spam-hit.ts; check-funnel-client.tsx when is_known_spammer === false && !is_exempt; no account-wall change -->
- [x] **5.6.2** Adjust scoring inputs when no DB match (matrix uses low-confidence or zero points). <!-- done: src/lib/scoring/spam-db-matrix-signal.ts (+ test); claim_events spam_db_matrix_tier/points in persist-spam-check-outcome.ts -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 5.7 FDCPA / debt collection note

- [x] **5.7.1** If category indicates debt collection, show informational callout: FDCPA may apply; TCPA letter not generated for that subject (or block TCPA path). <!-- done: src/lib/constants/fdcpa-debt-collection.ts (+ test); check-funnel-client.tsx when is_debt_collection; persist claim_events tcpa_letter_blocked; spam-check-pipeline is_debt_collection -->
- [x] **5.7.2** Do not promise future product; optional email capture for vertical interest. <!-- done: debt_collection_interest in email-capture-trigger.ts, email-capture-modal.tsx, waitlist constants + migration 20260516183000_waitlist_debt_collection_interest.sql -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

**Assumptions / risks (Phase 5.7 — carry until Phase 6.6 / product lock):**

- **Category resolution:** Debt collection detection uses the same §5.5 aliases as exempt handling (`Debt Collector`, `debt_collector`, etc.) via [`resolveExemptCategory`](src/lib/constants/exempt-categories.ts) / [`isDebtCollectionCallCategory`](src/lib/constants/fdcpa-debt-collection.ts).
- **TCPA attorney-referral block:** Blocking is persisted on `claim_events` (`tcpa_letter_blocked = fdcpa_debt_collection` — rename to `tcpa_referral_blocked` in a future cleanup). Phase **6.6** `canReferToAttorney` must call [`isTcpaLetterBlockedForCallCategory`](src/lib/constants/fdcpa-debt-collection.ts) (or renamed helper).
- **Email capture:** `debt_collection_interest` only when **every** subject is exempt **and** debt-collection category; mixed exempt claims still use `exempt_only`.

---

## Phase 6 — DNC, company ID, registered agent

### 6.1 Federal DNC spike

- [x] **6.1.1** Research permissible access path (direct FTC, reseller, manual attestation-only MVP). <!-- done: docs/spikes/20260516190000-federal-dnc-access.md — FTC dnc-complaints ≠ registry; SAN telemarketer path N/A for v0.1; vendor TBD §6.2; v0.1 manual attestation -->
- [x] **6.1.2** Document decision in Open questions section + dated note in repo `docs/` if helpful. <!-- done: docs/spikes/20260516190000-federal-dnc-access.md; Open questions Integrations below -->
- [x] **6.1.3** If unavailable: UI copy “Federal DNC check unavailable”; scoring must not fabricate positives. <!-- done: src/lib/constants/federal-dnc-unavailable.ts; check-funnel-client.tsx; submit federal_dnc JSON; src/lib/scoring/federal-dnc-matrix-signal.ts (+ tests) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md -->

### 6.2 Federal DNC (attestation + eligibility — not registry API by default)

- [ ] **6.2.0** **Legal:** Confirm with counsel that automated National Registry access (FTC SAN or vendor e.g. RealPhoneValidation) is **not** permitted for claim-scoring / letters given [FTC Q&A #13](https://www.ftc.gov/business-guidance/resources/qa-telemarketers-sellers-about-dnc-provisions-tsr-0). **Product assumption (spike):** attestation-only until counsel approves otherwise — do not ship registry API.
- [x] **6.2.1** Qualification UX: **gate** — user must explicitly attest National DNC yes/no + registration date before proceeding; link [donotcall.gov](https://www.donotcall.gov) + copy re FTC confirmation email date ([`federal-dnc-attestation.ts`](src/lib/constants/federal-dnc-attestation.ts)) → persist `dnc_check_results` / `claim_events` (`source: user_input`). <!-- done: src/components/qualify/federal-dnc-attestation-form.tsx, src/app/(post-check)/qualify/[claimSubjectId]/page.tsx, src/app/api/qualify/federal-dnc/route.ts, src/lib/dnc/federal-dnc-attestation-gate.ts, src/lib/dnc/persist-federal-dnc-attestation.ts -->
- [x] **6.2.2** Compute `federal_dnc_eligible` from attested `federal_dnc_registration_date` + `earliest_call_date` (31-day rule) via [`federal-dnc-eligibility.ts`](src/lib/dnc/federal-dnc-eligibility.ts); recompute when qualification provides dates; wire [`resolveFederalDncMatrixSignal`](src/lib/scoring/federal-dnc-matrix-signal.ts) with `attestedByUser`. <!-- done: persist + src/lib/dnc/recompute-federal-dnc-eligibility.ts (call from Phase 7 Q10); eligible null until earliest_call_date -->
- [ ] **6.2.3** *(Only if 6.2.0 approves)* Server-only registry client; map vendor response into `dnc_check_results` — **not** planned for v0.1.
- [x] **6.2.4** **Optional evidence:** Let user upload a screenshot of their FTC donotcall.gov registration confirmation email (shows registration date, e.g. ending in …7907 on October 17, 2007). **Not required** to proceed past the attestation gate; store path on claim/subject metadata or Supabase Storage + `claim_events` reference; supportive copy only (not legal verification by RingBounty). <!-- done: supabase/migrations/20260516193000_federal_dnc_evidence_storage.sql (claim-evidence bucket), src/lib/dnc/federal-dnc-evidence.ts, upload-federal-dnc-evidence.ts, multipart POST /api/qualify/federal-dnc, federal-dnc-attestation-form.tsx -->

**§6.2 — Bridge to Phase 7 (call dates)**
- When implementing Phase 7 call dates (§7.4), call [`recomputeFederalDncEligibility`](src/lib/dnc/recompute-federal-dnc-eligibility.ts) with the attestation already stored in `dnc_check_results`, **or** pass `earliest_call_date` on [`POST /api/qualify/federal-dnc`](src/app/api/qualify/federal-dnc/route.ts). Wire that hook when starting §7.4 (Q10 most recent call date — use as earliest-call proxy until a dedicated earliest-call field exists).

**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md Phase 6.1–6.2 federal DNC table -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md 2026-05-16 Phase 6.1–6.2 -->

### 6.3 State DNC (defer to v0.2 if needed; scaffold optional)

- [x] **6.3.1** Constants: list of states with registries per PRD §7 Step 4. <!-- done: src/lib/constants/state-dnc-registries.ts (+ test) -->
- [x] **6.3.2** If v0.1 ships without state APIs: set `state_dnc_applicable` + nulls + UI “coming soon” or skip. <!-- done: src/lib/dnc/scaffold-state-dnc-row.ts, persist-federal-dnc-attestation.ts (userState), src/components/qualify/state-dnc-coming-soon.tsx, qualify page, /check submit state_dnc JSON, state-dnc-access.ts -->
- [x] **6.3.3** Abstract `StateDncProvider` interface for future. <!-- done: src/lib/dnc/state-dnc-provider.ts (+ UnavailableStateDncProvider, test) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md Phase 6.3 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md 2026-05-16 Phase 6.3 -->

### 6.4 Company identification

- [x] **6.4.0** **Policy (locked v0.1):** [`docs/company-identification-strategy.md`](docs/company-identification-strategy.md) — only **Nomorobo** + **user Q13** set `company_identified`; Twilio CNAM + Whitepages are **hints** only; spoofing → Q13/voicemail are the real unlock. <!-- done: strategy doc + merge-spam-results.ts, enrich-merged-company-from-lookup.ts, check-funnel-client.tsx -->
- [x] **6.4.1** If spam merge yields Nomorobo `reported_name`: set `company_identified = true`, `company_name`, `company_name_source=nomorobo` on subject + `claim_events`. Twilio CNAM → `company_name_hint` only (not identified). <!-- done: merge-spam-results.ts, persist-spam-check-outcome.ts -->
- [x] **6.4.2** If not identified: optional enrichment — **Whitepages** (flag-gated, hint only); **FTC complaints** spike deferred (bulk ETL only). <!-- Whitepages: docs/spikes/20260516220000-whitepages-company-lookup.md; FTC: docs/spikes/20260516210000-ftc-complaints-company-lookup.md -->
- [x] **6.4.3** If still unknown: `company_identified = false`; `claim_events.tcpa_letter_blocked = company_unidentified` (legacy key — blocks attorney referral until Q13). <!-- done: company-identification.ts -->
- [x] **6.4.4** `/check` UX: unidentified copy + CNAM/Whitepages hint line when present; attorney referral path needs Q13 (§7.5). <!-- done: check-funnel-client.tsx — update copy away from “demand letter” in marketing/constants pass -->
- [ ] **6.4.5** **Bake-off (product):** 30–50 real spam numbers — Nomorobo vs trial **YouMail** (if miss rate high); document in `docs/` before re-adding YouMail to PRD.
- [ ] **6.4.6** **Twilio VOIP / line type:** Persist `line_type_intelligence` on `claim_events` for claim-strength scoring (Lookup v2 already called; not CNAM for company ID).
- [ ] **6.4.7** **FTC bulk index (v1):** Offline ingest consumer complaint data → phone→name lookup table (not live `dnc-complaints` API).


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md Phase 6.4 + strategy link -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md Phase 6.4 + policy lock -->

**Assumptions / risks (Phase 6.4 — carry forward):**

- **CNAM / Whitepages** must not unlock attorney referral without Q13 until counsel approves higher-trust automation.
- **Next engineering priority:** §**6.6** `canReferToAttorney`, §**7.5.4** voicemail upload (v0.1 web), §**7.5.1** Q13 + §**7.5.1b** soft OpenCorporates verify, §**8** scoring/results, §**13.1–13.2** attorney path + evidence PDF.
- **YouMail / TrueCaller / Google enrichment:** deferred until bake-off or v1; see strategy doc.

### 6.5 Registered agent lookup

- [x] **6.5.1** OpenCorporates client: search by `company_name` + `user.state`; handle pagination/errors. <!-- done: `src/lib/company/opencorporates-api.ts`, `lookup-registered-agent-opencorporates.ts`; soft verify refactored in `opencorporates-soft-verify.ts` -->
- [x] **6.5.2** If not found in-state: national search fallback (Delaware, etc.). <!-- done: `OPENCORPORATES_NATIONAL_FALLBACK_JURISDICTIONS` us_de, us_nv, us_wy + country_code=us -->
- [x] **6.5.3** Persist `registered_agent_name`, `registered_agent_address`, `registered_agent_lookup_source`. <!-- done: `persist-registered-agent-lookup.ts`, wired in `persist-spam-check-outcome.ts`, `persist-user-company-identification.ts` -->
- [x] **6.5.4** If not found: UI “manual lookup required” + link to static SOS guide for user’s state (top 10 states content task). <!-- done: `registered-agent-lookup.ts`, `check-funnel-client.tsx` -->
- [x] **6.5.5** Rate limit OpenCorporates calls per session; surface “try again later” when budget exceeded (Open questions). <!-- done: `assert-opencorporates-lookup-allowed.ts`, `rate-limit/constants.ts` (6/session/hour) -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README.md Phase 6.5 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG.md Phase 6.5 -->

### 6.6 Attorney referral eligibility (replaces letter purchase gates)

> Replaces cancelled `canPurchaseLetter` / Stripe letter Checkout. Central gate for “Connect with attorney” and evidence-package handoff.

- [x] **6.6.1** Central function `canReferToAttorney(claim, subject): { ok: boolean; reasons: string[] }` — mirror old letter rules: exempt, `ineligible` strength, unidentified company (`tcpa_letter_blocked = company_unidentified`), FDCPA debt collection ([`isTcpaLetterBlockedForCallCategory`](src/lib/constants/fdcpa-debt-collection.ts)), federal DNC / SOL warnings informational only (do not hard-block unless product decides). <!-- done: `src/lib/claims/can-refer-to-attorney.ts`, `src/lib/constants/attorney-referral.ts` -->
- [x] **6.6.2** Enforce on server before creating `leads` row or showing attorney CTA (never UI-only). Deprecate or stub any `canPurchaseLetter` references. <!-- done: `assertCanReferToAttorney`; `canPurchaseLetter` deprecated alias; wire on leads API in §13.1 -->
- [x] **6.6.3** Unit tests for: exempt, unidentified company, ineligible strength, debt collection block. <!-- done: `src/lib/claims/can-refer-to-attorney.test.ts` -->
- [x] **6.6.4** **Copy/constants pass:** Replace user-facing “demand letter” gate messages (e.g. [`company-identification.ts`](src/lib/constants/company-identification.ts), [`registered-agent-lookup.ts`](src/lib/constants/registered-agent-lookup.ts), FDCPA copy) with attorney-referral framing. <!-- done: §6.6 gate constants; marketing §3.7 still open -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README v0.1 pivot + Phase 6.6 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG 2026-05-17 -->

---

## Phase 7 — Qualification flow (`/qualify/[id]`)

### 7.1 Routing and state machine

- [x] **7.1.1** Dynamic route `app/qualify/[claimSubjectId]/page.tsx` (or by claim id + subject index — pick one URL scheme). <!-- done: `src/app/(post-check)/qualify/[claimSubjectId]/page.tsx` — URL by subject id + optional `?claim=` -->
- [x] **7.1.2** Load subject + parent claim; 404 if not owned (post-auth) or invalid session. <!-- done: `src/lib/qualify/load-qualify-context.ts`, `load-qualify-context.test.ts` -->
- [x] **7.1.3** Step state: `screen` 1–4 persisted in URL query `?step=` or in `claim_events` for resume. <!-- done: `src/lib/qualify/qualify-step.ts`, `qualify-step.test.ts`, `src/components/qualify/qualify-wizard-shell.tsx`; resume key `qualify_step_resume` -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README Phase 7.1 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG 2026-05-17 §7.1 -->

### 7.2 Screen 1 — Consent / EBR

- [x] **7.2.1** Q1 UI + store `qualification_answer` / `gave_direct_consent` boolean. <!-- done: `screen-1-consent-form.tsx`, `screen-1-consent.ts`, `POST /api/qualify/screen-1` -->
- [x] **7.2.2** Q2 third-party consent UI + storage. <!-- done: key `third_party_consent_possible` -->
- [x] **7.2.3** Q3 ongoing relationship UI + storage. <!-- done: key `has_existing_relationship` -->
- [x] **7.2.4** If yes to Q1 or Q3: show PRD explainer modal; write `claim_events` note for attorney evidence package / scoring context (not letter generation). <!-- done: EBR overlay + `ebr_strength_adjustment_*` events; copy `qualify-screen-1.ts` -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README §7.2 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG 2026-05-17 §7.2 -->

### 7.3 Screen 2 — Stop request / willful

- [x] **7.3.1** Q4 yes/no → branch. <!-- done: `screen-2-stop-request-form.tsx` — No skips Q5–Q7 -->
- [x] **7.3.2** Q5 method enum mapped to PRD strings (`verbal`, `text_stop`, etc.). <!-- done: `qualify-screen-2.ts` STOP_REQUEST_METHOD_OPTIONS -->
- [x] **7.3.3** Q6 date picker with validation (not future). <!-- done: `parseStopRequestDate`, input `max=today` -->
- [x] **7.3.4** Q7 post-stop calls yes/no. <!-- done: `calls_after_stop_request` claim_events -->
- [x] **7.3.5** Write `internal_dnc_*` fields into `dnc_check_results` row and/or `claim_events` consistently. <!-- done: `screen-2-stop-request.ts` + `POST /api/qualify/screen-2` -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README §7.3 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG 2026-05-17 §7.3 -->

### 7.4 Screen 3 — Call details

- [x] **7.4.1** Q8 total call count control (slider buckets or numeric input per PRD). <!-- done: `CALL_COUNT_TOTAL_BUCKETS` in `qualify-screen-3.ts`, `screen-3-call-details-form.tsx` -->
- [x] **7.4.2** Q9 post-stop count (conditional). <!-- done: numeric input when Screen 2 `stop_request_made`; key `call_count_after_stop` -->
- [x] **7.4.3** Q10 most recent call date (date picker); used for SOL. **§6.2 hook:** on save, call [`recomputeFederalDncEligibility`](src/lib/dnc/recompute-federal-dnc-eligibility.ts) with stored federal DNC attestation + this date as `earliestCallDate` (or pass `earliest_call_date` on federal-dnc POST if attestation and call date are submitted together). <!-- done: `persistQualifyScreen3Answers` → `recomputeFederalDncEligibility`; proxy earliest call via `most_recent_call_date` -->
- [x] **7.4.4** Q11–Q12 time-of-day violations counts. <!-- done: `calls_before_8am`, `calls_after_9pm`, `calls_after_9pm_count` when Q12 Yes -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README §7.4 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG 2026-05-17 §7.4 -->

### 7.5 Screen 4 — Company identification assist

- [x] **7.5.3** **Spike (priority):** Voicemail → company ID — [`docs/spikes/20260516230000-voicemail-company-identification.md`](docs/spikes/20260516230000-voicemail-company-identification.md). Highest-trust source; v0.1 web file upload (no native app). <!-- done: spike doc -->
- [x] **7.5.4** **Implement voicemail path (v0.1 web):** “Do you have a voicemail?” → upload mp3/m4a/wav → OpenRouter Whisper → extract `company_name`, callback #, product → if name: `company_identified = true`, `source: voicemail_transcription` on `claim_events`. Storage + qualify UI + API. <!-- done: `POST /api/qualify/voicemail`, `openrouter-voicemail.ts`, `persist-voicemail-company-identification.ts`, `Screen4CompanyForm` -->
- [x] **7.5.1** Q13 — when voicemail missing / no extraction: company name + context (pitch, callback #). On submit: [`persistUserCompanyIdentification`](src/lib/company/persist-user-company-identification.ts) → `company_identified = true`, `source: user_input`, clear company referral block (`tcpa_letter_blocked = company_unidentified`). <!-- done: `POST /api/qualify/screen-4`, `screen-4-company-identification.ts` -->
- [x] **7.5.1b** **Soft OpenCorporates verify after Q13** (not a hard gate): if `user_input` → [`softVerifyCompanyNameWithOpenCorporates`](src/lib/company/opencorporates-soft-verify.ts) → `claim_events.company_name_verification_status` = `user_input_verified` \| `user_input_unverified`. **Attorney referral allowed either way**; show [`COMPANY_NAME_UNVERIFIED_WARNING`](src/lib/constants/company-name-verification.ts) when unverified. Env: `OPENCORPORATES_API_TOKEN`. <!-- done: wired via `persistUserCompanyIdentification` on screen-4 POST -->
- [x] **7.5.2** Q14 evidence yes/no → `claim_events` for attorney evidence package (screenshots, call logs, etc. — feeds §13.2 PDF). <!-- done: `has_additional_evidence` key -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README §7.5 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG 2026-05-17 §7.5 -->

### 7.6 Cell vs residential attestation

- [x] **7.6.1** New question UI: “Was this number calling your mobile phone or a home/landline?” (copy lawyer-reviewed). <!-- done: `Screen5LineTypeForm`, `qualify-screen-5.ts` — counsel may refine copy in §Open -->
- [x] **7.6.2** Persist choice in `claim_events` (e.g. `line_type` = `mobile` | `residential`). <!-- done: `POST /api/qualify/screen-5`, `screen-5-line-type.ts` -->
- [x] **7.6.3** Map to statute subsections in shared module for **scoring + attorney evidence summary** (§227(b)(1)(A)(iii) vs (B)) — not for auto-generated demand letters. <!-- done: `src/lib/tcpa/line-type-statute.ts` -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README §7.6 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG 2026-05-17 §7.6 -->

### 7.7 Completion

- [x] **7.7.1** On final submit: set `claim.status` to `qualified` (or equivalent); enqueue scoring job or run synchronously if fast. <!-- done: `complete-qualify-claim.ts` on `POST /api/qualify/screen-5`; `claim_events` `scoring_status=pending` for Phase 8 -->
- [x] **7.7.2** Redirect to `/results` (primary post-qualify surface) with attorney CTA when `canReferToAttorney`; drop `/summary` letter-cart flow for v0.1 unless repurposed as read-only claim overview. <!-- done: `results/page.tsx` + `AttorneyReferralCta`; `/summary` → `/results` redirect -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README §7.7 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG 2026-05-17 §7.7 -->

---

## Phase 8 — Scoring, SOL, value display

### 8.1 Strength matrix implementation

- [x] **8.1.1** Translate PRD §8 table to code constants (points per signal). <!-- done: `src/lib/scoring/strength-matrix-constants.ts`; reuses `spam-db-matrix-signal.ts`, `federal-dnc-matrix-signal.ts`, `state-dnc-matrix-signal.ts` -->
- [x] **8.1.2** Input struct aggregating: spam scores, DNC flags, stop request, time-of-day counts, company ID, RA found, SOL flags, consent negatives, exempt. <!-- done: `StrengthMatrixInput` in `strength-matrix.ts` -->
- [x] **8.1.3** Compute total score; apply exempt override → `ineligible`. <!-- done: `computeStrengthMatrix` -->
- [x] **8.1.4** Map score to `strong` | `moderate` | `weak` | `ineligible` thresholds. <!-- done: `mapScoreToClaimStrength` -->
- [x] **8.1.5** Unit tests: matrix edge cases (single call, exempt, max points). <!-- done: `strength-matrix.test.ts` -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README §8.1 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG 2026-05-17 §8.1 -->

### 8.2 Statute of limitations

- [x] **8.2.1** Implement `getStateSolYears(state: string): number` table (defaults + notes in code comments). <!-- done: `src/lib/scoring/state-sol-years.ts`, `federal-sol-years.ts` -->
- [x] **8.2.2** Compute `within_federal_sol`, `within_state_sol` from `most_recent_call_date`. <!-- done: `compute-sol-flags.ts` -->
- [x] **8.2.3** If both false: set `likely_time_barred` flag; UI warning banner; do not hard-block payment per PRD. <!-- done: `likely_time_barred` + [`SolWarningBanner`](src/components/results/sol-warning-banner.tsx) on `/results` -->
- [x] **8.2.4** Persist SOL flags in `claim_events`. <!-- done: `persist-sol-flags.ts` (`value_calculated`); wired from Screen 3 save -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README §8.2 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG 2026-05-17 §8.2 -->

### 8.3 Valuation engine (three scenarios)

- [x] **8.3.1** Implement PRD §11 formulas: `standard_violation_count`, `willful_violation_count`, `time_violation_count`. <!-- done: `compute-violation-counts.ts`, `buildViolationCountInput` -->
- [x] **8.3.2** Compute conservative low/high, realistic, maximum in cents; avoid floating point — integers only. <!-- done: `compute-valuation.ts`, `valuation-constants.ts` -->
- [x] **8.3.3** If SOL warning: append caveat string to all displays. <!-- done: `buildValuationDisplayCaveat` + `valuation-caveat.ts` (`likelyTimeBarred` on `ValuationScenarios`) -->
- [x] **8.3.4** Unit tests with fixed qualification fixtures and expected dollar outputs. <!-- done: `compute-valuation.test.ts` -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README §8.3 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG 2026-05-17 §8.3 -->

### 8.4 Results UI (`/results`) — strength / probability + attorney CTA

- [x] **8.4.1** Per subject card: spam summary, DNC summary, exempt badge, strength badge. <!-- done: `ResultsSubjectCard`, `subject-evidence-summaries.ts`, `load-results-page-context.ts` -->
- [x] **8.4.2** Three-scenario dollar display with labels; mandatory caveat paragraph under numbers (PRD §11) — **informational estimates**, not a recommended demand. <!-- done: `ResultsValuationPanel`, `results-strength.ts` labels -->
- [x] **8.4.3** Strength-specific UI: green/yellow/orange/red; plain-language **“likelihood you have something worth discussing with an attorney”** copy (lawyer-reviewed); weak → checkbox acknowledgement before attorney CTA. <!-- done: `ResultsStrengthHeader`, `results-strength.ts` (placeholder copy), `AttorneyReferralCta` weak ack -->
- [x] **8.4.4** Ineligible: hide attorney CTA; show reasons bullet list; offer email capture (Phase 2.8). <!-- done: `ResultsIneligiblePanel` + `EmailCaptureModal` -->
- [x] **8.4.5** Eligible (`canReferToAttorney`): primary CTA **“Connect with an attorney — free”** → Phase 13.1 flow (expectation screen + `leads` insert). <!-- done: `AttorneyReferralCta` (disabled until §13.1); runtime strength via `load-results-page-context.ts` -->


**Docs — this subsection**
- [x] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow. <!-- done: README §8.4 -->
- [x] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip). <!-- done: CHANGELOG 2026-05-17 §8.4 -->

### 8.5 Persist outputs

- [ ] **8.5.1** Write `claims.claim_strength`, `estimated_*_cents` fields from engine.
- [ ] **8.5.2** Write detailed `claim_events` rows (`value_calculated` keys) for audit trail.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 9 — Summary, bundles, Stripe, Tax

> **STATUS: CANCELLED for v0.1 (2026-05-17)** — DIY demand letter purchase removed. Do not implement Stripe letter Checkout, bundles, or Tax for consumer letters. Optional: lightweight `/summary` as read-only multi-subject overview **without** pay CTAs. Attorney monetization → Phase 13 (firm Connect, charge on accept).

### 9.1 Summary page `/summary` *(cancelled — letter cart)*

- [ ] ~~**9.1.1** Group subjects by normalized `company_name`~~ — **Deferred:** only if repurposed as non-commerce claim overview.
- [ ] ~~**9.1.2** Per group: show aggregated strength~~ — **Moved to** `/results` (§8.4).
- [ ] ~~**9.1.3** Per group CTA: “Get letter for {Company}”~~ — **Cancelled.**
- [ ] ~~**9.1.4** Display bundle pricing table~~ — **Cancelled.**


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 9.2 Stripe catalog *(cancelled — consumer letters)*

- [ ] ~~**9.2.1–9.2.3** Letter products / prices~~ — **Cancelled v0.1.** Revisit only if product reintroduces paid consumer documents.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 9.3 Stripe Tax *(deferred with Phase 9)*

- [ ] ~~**9.3.1–9.3.4**~~ — **Deferred** until a paid consumer SKU exists (none in v0.1).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 9.4 Checkout session creation *(cancelled)*

- [ ] ~~**9.4.1–9.4.5** Consumer letter Checkout~~ — **Cancelled v0.1.**


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 9.5 Webhooks *(letter purchase — cancelled; Connect webhooks in Phase 13)*

- [ ] ~~**9.5.2–9.5.3** `letters` insert on Checkout~~ — **Cancelled v0.1.**
- [ ] **9.5.1** *(optional infra)* Route Handler `POST /api/webhooks/stripe` skeleton if firm Connect ships in v0.2 — not required for v0.1 attorney referral without payment.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 9.6 Demand scenario user choice *(cancelled — was pre-Checkout for letters)*

- [ ] ~~**9.6.1–9.6.3**~~ — **Cancelled.** Valuation scenarios display on `/results` only (§8.4.2); no user “demand amount” selection for v0.1.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 10 — Letter generation, PDF, filing guide, account

> **STATUS: CANCELLED for v0.1 (2026-05-17)** — No OpenRouter demand-letter generation, letter PDFs, `/letter/[id]` purchase UX, or filing guide gated on purchased letters. **Promoted instead:** attorney evidence PDF (old §13.2). Keep `letters` table/migrations for possible future use; do not build generation pipeline.

### 10.1 Async architecture *(cancelled — letter jobs)*

- [ ] ~~**10.1.1–10.1.3** Letter generation worker~~ — **Cancelled v0.1.**


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.2 Few-shot corpus *(cancelled)*

- [ ] ~~**10.2.1–10.2.3** Demand letter few-shots~~ — **Cancelled v0.1.**


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.3 OpenRouter integration *(reprioritized)*

- [ ] **10.3.1** Server-only OpenRouter client — **v0.1 use:** Whisper transcription for voicemail (§7.5.4) only. **Not** demand-letter completion.
- [ ] ~~**10.3.2–10.3.4** Letter prompts / token tracking per letter~~ — **Cancelled v0.1.**


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.4 Output validation *(cancelled — generated letters)*

- [ ] ~~**10.4.1–10.4.3**~~ — **Cancelled v0.1.**


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.5 PDF generation and storage *(moved to attorney evidence — §13.2)*

- [ ] ~~**10.5.2–10.5.4** Demand letter PDF to `letters` bucket~~ — **Cancelled v0.1.**
- [ ] **10.5.1** Choose PDF strategy for **evidence package** (§13.2) — same tech options apply.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.6 Letter page `/letter/[id]` *(cancelled — stub may remain)*

- [ ] ~~**10.6.1–10.6.4** Purchased letter download UX~~ — **Cancelled v0.1.** Remove or redirect `/letter/*` in marketing/cleanup pass; keep route stub if needed to avoid 404 during transition.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.7 Filing guide `/guide` *(deferred)*

- [ ] ~~**10.7.1** Gate on purchased letter~~ — **Deferred** — no letter purchase in v0.1. Optional later: informational guide for users who retained an attorney (not DIY filing).
- [ ] **10.7.2–10.7.3** PRD §16 content — **Deferred** with guide; low priority vs attorney path.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 10.8 Account `/account` *(partial — no letters list v0.1)*

- [ ] **10.8.1** List claims with statuses, strength, and attorney lead status (`leads` join).
- [ ] ~~**10.8.2–10.8.3** Letters list + guide links~~ — **Cancelled v0.1** (no purchased letters).


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
- [ ] **11.2.5** `/tcpa-demand-letter` — **Repurpose or 301** to attorney-referral / checker landing (no DIY letter promise).
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
- [ ] **12.5.4** Post-deploy smoke: anonymous check → account wall → magic link → merge → qualify → `/results` strength → attorney referral (no letter Checkout).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

## Phase 13 — Attorney referral, evidence package, firm platform

> **v0.1 core (promoted 2026-05-17):** §**13.1** consumer attorney path + §**13.2** evidence PDF. §**13.3+** remain **v0.2** (Stripe Connect, firm dashboard, lead billing).

### 13.1 Consumer attorney path *(v0.1)*

- [ ] **13.1.1** Results CTA: **“Connect with an attorney — free”** (no DIY letter branch). Shown only when `canReferToAttorney` (§6.6).
- [ ] **13.1.2** Expectation page: 48h contact, contingency **informational** wording per PRD; clear not legal advice / no guarantee of representation.
- [ ] **13.1.3** Create `leads` row linked to `claim_id` (+ subject ids); status `new`; trigger evidence PDF job (§13.2).
- [ ] **13.1.4** Email confirmation to user; optional SMS later.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 13.2 Evidence PDF for firms *(v0.1)*

- [ ] **13.2.1** Server job compiling claim_events, qualification answers, spam/DNC summary, company + registered agent, strength score, valuation bands, and uploaded evidence paths into a single PDF for firms.
- [ ] **13.2.2** Upload to Storage; save URL on `leads.evidence_pdf_url`.
- [ ] **13.2.3** Redact sensitive third-party PII if required by firm contract (future).
- [ ] **13.2.4** User-facing summary on `/results`: “What we’re sharing with attorneys” checklist (transparency, not legal advice).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 13.3 Stripe Connect onboarding *(v0.2)*

- [ ] **13.3.1** Dashboard Connect settings: Standard or Express accounts for firms (decide).
- [ ] **13.3.2** Onboarding link generation for `law_firms` admin user.
- [ ] **13.3.3** Store `stripe_connect_account_id` on firm; webhook `account.updated` for `charges_enabled`.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 13.4 Firm dashboard app *(v0.2)*

- [ ] **13.4.1** Separate deploy or Next route group `firms.*` subdomain middleware host check.
- [ ] **13.4.2** Firm user auth: map `firm_users.auth_user_id` to Supabase Auth invites.
- [ ] **13.4.3** Lead list view with filters: state, min value, strength.
- [ ] **13.4.4** Supabase Realtime subscription to `leads` insert where `assigned_firm_id` matches (or pool model — align with PRD).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 13.5 Lead accept and payment *(v0.2)*

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
- [ ] ~~**14.1.5** Stripe in-app letter purchases~~ — **Cancelled** unless product reintroduces paid SKUs.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### 14.2 iOS app (screenshot path)

- [ ] **14.2.1** Image picker + upload to signed URL; vision model prompt to extract numbers/dates/counts.
- [ ] **14.2.2** User confirmation step for parsed rows before server persistence.
- [ ] **14.2.3** Reuse same qualification + results + attorney referral flows via shared screens.


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
- [x] **Evidence checklist gating** — Require all boxes vs “continue anyway” acknowledgement (Phase 4.2.3 fork). <!-- done: both — all items OR “continue anyway” in src/components/check/check-funnel-client.tsx + src/lib/check/evidence-checklist-gate.ts -->


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### Integrations and compliance

- [x] **Federal DNC / FTC** — **Attestation-only** for registry status (no SAN/vendor scrub for claim scoring unless counsel approves). FTC registry access certified only for TSR / preventing telemarketing calls ([Q&A #13](https://www.ftc.gov/business-guidance/resources/qa-telemarketers-sellers-about-dnc-provisions-tsr-0)); RealPhoneValidation-style APIs still require SAN and same purpose limits. Spike: [`docs/spikes/20260516190000-federal-dnc-access.md`](docs/spikes/20260516190000-federal-dnc-access.md).
- [ ] **Nomorobo + Twilio at launch** — Both enabled by default when keys present? Pricing / rate limits; storage of raw responses under Nomorobo / Twilio ToS (§5.2 / §5.3).
- [ ] **OpenCorporates** — Pricing tier, monthly cap, behavior when cap hit (queue vs fail vs manual-only).
- [ ] **State DNC APIs** — Per-state reality (API vs scrape vs none); order of rollout.
- [ ] **FTC consumer complaint lookup** — Allowed use for company identification; implementation approach.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### Payments and money

- [x] **Consumer letter Checkout** — **Cancelled v0.1 (2026-05-17).** No Stripe letter SKUs, bundles, or Tax for DIY letters.
- [ ] **Stripe bundle Checkout structure** — **Deferred** (was for letter bundles).
- [ ] **Stripe Tax** — **Deferred** with consumer Checkout.
- [ ] **Currency** — USD-only for v0.1 assumed; confirm.
- [ ] **Partial bundle completion** — **N/A** until a paid consumer SKU returns.


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

### Attorney referral and liability (product, not legal advice)

- [ ] **Strength / probability copy** — Lawyer-reviewed language for “likelihood worth discussing with an attorney” on `/results` (Phase 8.4.3); must not promise representation or recovery.
- [ ] **§227(b)(1)(A)(iii) vs (B)** — Final UX copy for attestation screen (Phase 7.6) without advising outcome.
- [ ] **Evidence PDF to firms** — What PII is included; user consent screen before `leads` insert (Phase 13.1 + 13.2.4).
- [ ] **Lead sharing consent** — Checkbox + privacy policy alignment for sharing claim data with third-party law firms.
- [x] ~~**DIY demand letters**~~ — **Removed from v0.1** (no generated letter PDFs; old open questions on user edits / AI letter review **closed**).


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
- [ ] **Leads ↔ subjects** — Ensure every `leads` row references the correct `claim_id` / subject set for multi-number claims (evidence PDF §13.2).
- [x] ~~**Letters ↔ company**~~ — **Deferred** with cancelled letter product (`letters` table retained only).
- [ ] **Connect account type** — Standard vs Express for law firms (Phase 13.3.1).


**Docs — this subsection**
- [ ] Update `README.md` if anything here changed setup, commands, user flows, or developer workflow.
- [ ] Update `CHANGELOG.md` with a short entry when the change is user-facing or notable for infra/tooling (otherwise note "infra / chore only" in the PR or skip).

---

*Last updated: 2026-05-17 — strategic pivot (evidence + strength + attorney referral; Phases 9–10 cancelled for v0.1; Phase 13.1–13.2 promoted). Sync when `prd.md` or decisions change.*

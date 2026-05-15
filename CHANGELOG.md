# Changelog

## 2026-05-15 (Phase 4.6 — loading, partial failures, retry, structured logs)

- **§4.6 `/check` UX + API:** While [`POST /api/check/submit`](src/app/api/check/submit/route.ts) runs, [`CheckFunnelClient`](src/components/check/check-funnel-client.tsx) shows per-number skeleton rows. Successful phone submits extend JSON with **`number_checks`** — parallel stub “providers” per number ([`parallel-check-pipeline-stub.ts`](src/lib/check/parallel-check-pipeline-stub.ts), Vitest [`parallel-check-pipeline-stub.test.ts`](src/lib/check/parallel-check-pipeline-stub.test.ts)); one failing provider still returns others. **Retry with backoff** (cap 8s) after consecutive submit failures; provider / pipeline failures log **`error_code`** via structured `console.error` JSON (`check_provider_failure`, `check_number_pipeline_failure`, `check_submit_unhandled`).
- **§4.6 follow-ups:** Stubs **always succeed in production** until you optionally add env-driven failure for staging. **Phase 5** replaces **`runStubChecksForPhoneList`** with real Nomorobo / YouMail adapters but **can keep the same `number_checks` shape**. Per-number progress is skeleton until the single response returns (**not streaming** until SSE or split requests).

## 2026-05-15 (Phase 4.5 — persist subjects + submit response)

- **§4.5 persistence:** Migration [`20260515160000_claims_status_checking.sql`](supabase/migrations/20260515160000_claims_status_checking.sql) adds `checking` to `claims.status`. [`POST /api/check/submit`](src/app/api/check/submit/route.ts) creates/loads the anonymous claim (**`draft`**), replaces `claim_subjects`, then updates to **`checking`**; session resolution uses `draft` **or** **`checking`** ([`anonymous-funnel-claim-status.ts`](src/lib/claims/anonymous-funnel-claim-status.ts)). Response includes **`claim_subject_ids`** plus **`claim_id`** (ids follow multi-row `INSERT … RETURNING` order, i.e. listed row order).

## 2026-05-15 (Phase 4.4 — normalization + persistence on `/check`)

- **§4.4 phone normalization:** Added `normalizeUsPhoneToE164` (NANP first-digit checks) with Vitests in [`us-phone.test.ts`](src/lib/check/us-phone.test.ts). [`CheckFunnelClient`](src/components/check/check-funnel-client.tsx) shows inline errors for incomplete lengths and invalid area/exchange patterns; duplicate detection uses validated E.164 keys.
- **§4.4 submit + storage:** [`POST /api/check/submit`](src/app/api/check/submit/route.ts) accepts `phone_displays` aligned with `phone_numbers`, replaces `claim_subjects` for the draft claim with `phone_number_normalized` (E.164) and optional `phone_number` (masked display), and returns `claim_id` when rows are written. Rate limits still apply before writes.

## 2026-05-15 (Phase 4.3 — phone entry on `/check`)

- **§4.3 number UX:** Masked U.S. NANP inputs (10 digits), **Add number** / **Remove** rows, cap **`CHECK_MAX_PHONE_ROWS` = 10**, client duplicate row highlighting, and **Run check** sending digits-only `phone_numbers` to [`POST /api/check/submit`](src/app/api/check/submit/route.ts) with server-side normalize + dedupe ([`us-phone.ts`](src/lib/check/us-phone.ts), Vitest [`us-phone.test.ts`](src/lib/check/us-phone.test.ts)). [`CheckOutcomePanel`](src/components/check-outcome-panel.tsx) listens for `rb-check-submitted` to refresh status. No DB migration (persistence is §4.5).

## 2026-05-15 (Phase 4.2 — evidence checklist on `/check`)

- **§4.2 checklist + gating:** Six PRD §10-style items with checkboxes, supportive non-guarantee copy, and **Continue to enter numbers** enabled when all are checked **or** the user acknowledges **continue anyway** ([`CheckFunnelClient`](src/components/check/check-funnel-client.tsx), [`evidence-checklist-items.ts`](src/lib/check/evidence-checklist-items.ts), [`evidence-checklist-gate.ts`](src/lib/check/evidence-checklist-gate.ts), Vitest [`evidence-checklist.test.ts`](src/lib/check/evidence-checklist.test.ts)). Reveal Step 1 placeholder until §4.3. Optional `claim_events` / `evidence_checklist_ack` insert not wired (anonymous funnel + RLS).

## 2026-05-15 (Phase 4.1 — `/check` route and step indicator)

- **`/check` funnel shell (§4.1):** Mobile-first layout via [`CheckPageShell`](src/components/check/check-page-shell.tsx); [`CheckStepIndicator`](src/components/check/check-step-indicator.tsx) shows **Step 0 — Preserve evidence** before **Step 1 — Enter numbers** (PRD §10). Step headings and intro copy in [`src/lib/check/constants.ts`](src/lib/check/constants.ts) (+ Vitest). Updated [`src/app/check/page.tsx`](src/app/check/page.tsx) and check layout padding. Checklist UI and number entry remain §4.2–4.3.

## 2026-05-15 (Homepage — wireframe layout)

- Rebuilt [`/`](src/app/page.tsx) to match the SEO/conversion wireframe: two-column hero, informational stats (no customer logos), problem/solution, three feature cards, infrastructure partners + trust badges, CTA band, FAQ accordion, multi-column footer. Section components under [`src/components/marketing/landing-*.tsx`](src/components/marketing/); copy in [`src/lib/marketing/landing-content.ts`](src/lib/marketing/landing-content.ts).

## 2026-05-15 (Phase 3.3–3.6 — FAQ, legal pages, global disclaimer)

- **FAQ (`/faq`):** Objection-handling Q&A with non-advice reminders ([`src/app/faq/page.tsx`](src/app/faq/page.tsx), [`src/lib/marketing/faq.ts`](src/lib/marketing/faq.ts), [`src/components/marketing/faq-list.tsx`](src/components/marketing/faq-list.tsx)).
- **Privacy (`/privacy`) and terms (`/terms`):** Plain-English policy pages; CCPA request path, third-party list, anonymous vs authenticated lifecycle, digital-product / no-refund wording ([`src/lib/marketing/privacy.ts`](src/lib/marketing/privacy.ts), [`src/lib/marketing/terms.ts`](src/lib/marketing/terms.ts), shared [`MarketingDocPage`](src/components/marketing/marketing-doc-page.tsx)).
- **Global disclaimer (§3.6):** [`DisclaimerBanner`](src/components/marketing/disclaimer-banner.tsx) with PRD exact string; mounted in site footer, check + post-check layouts, protected account shell, and marketing footers. Vitest: [`faq.test.ts`](src/lib/marketing/faq.test.ts), extended [`constants.test.ts`](src/lib/marketing/constants.test.ts).

## 2026-05-15 (Phase 3.1–3.2 — marketing landing)

- **Landing (`/`):** Replaced starter template with RingBounty hero, trust strip, PRD §3 disclaimer, and policy footer links ([`src/app/page.tsx`](src/app/page.tsx), [`src/components/marketing/`](src/components/marketing/)). Primary CTA → `/check`; secondary → `/how-it-works`. Page metadata + Open Graph use [`/opengraph-image.png`](src/app/opengraph-image.png).
- **How it works:** New [`/how-it-works`](src/app/how-it-works/page.tsx) — informational flow (check → qualify → pay → letter → file), TCPA overview, FAQ link, disclaimer block.
- **Public routes:** [`isPublicMarketingPath`](src/lib/marketing/public-routes.ts) wired in [`src/lib/supabase/proxy.ts`](src/lib/supabase/proxy.ts) so `/how-it-works`, `/faq`, `/privacy`, and `/terms` are reachable without login (legal pages still ship in §3.4–3.5).

## 2026-05-15 (Phase 2.7–2.8 — rate limiting + email capture)

- **Rate limiting (§2.7):** Migration `supabase/migrations/20260515120000_rate_limit_and_newsletter_waitlist.sql` adds `public.rate_limit_buckets` and RPC `consume_rate_limit`. App helpers in [`src/lib/rate-limit/`](src/lib/rate-limit/); [`POST /api/check/submit`](src/app/api/check/submit/route.ts) returns **429** when hourly limits are exceeded. CAPTCHA stub in [`captcha.ts`](src/lib/rate-limit/captcha.ts).
- **Email capture (§2.8):** `public.newsletter_waitlist` + [`POST /api/waitlist`](src/app/api/waitlist/route.ts) (email validation, SHA-256 dedupe, IP rate limit). [`EmailCaptureModal`](src/components/email-capture-modal.tsx) wired in [`CheckOutcomePanel`](src/components/check-outcome-panel.tsx) for ineligible / exempt-only gate status and explicit **Notify me** CTA. Placeholder marketing consent copy in [`src/lib/waitlist/constants.ts`](src/lib/waitlist/constants.ts). Gate API adds `show_email_capture` / `email_capture_reason`.

### MVP defaults (2.7-2.8)

| Area | Default | Where to change |
|------|---------|-----------------|
| Rate-limit **store** | In-DB (`rate_limit_buckets` + `consume_rate_limit` RPC), not Redis/KV | New store = new migration + swap callers in `src/lib/rate-limit/` |
| Check submissions / **session** | **10** per hour per `rb_anonymous_sid` | [`CHECK_SUBMISSION_LIMIT_PER_SESSION`](src/lib/rate-limit/constants.ts) |
| Check submissions / **IP** | **30** per hour | [`CHECK_SUBMISSION_LIMIT_PER_IP`](src/lib/rate-limit/constants.ts) |
| Rate-limit **window** | **3600** seconds (1 hour) | [`CHECK_SUBMISSION_WINDOW_SECONDS`](src/lib/rate-limit/constants.ts), [`WAITLIST_WINDOW_SECONDS`](src/lib/rate-limit/constants.ts) |
| Waitlist signups / **IP** | **5** per hour | [`WAITLIST_LIMIT_PER_IP`](src/lib/rate-limit/constants.ts) |
| **CAPTCHA** | Off (stub only) | [`src/lib/rate-limit/captcha.ts`](src/lib/rate-limit/captcha.ts) |
| Waitlist **dedupe** | SHA-256 of normalized email (`email_hash` unique) | [`src/lib/waitlist/hash-email.ts`](src/lib/waitlist/hash-email.ts) |
| Email capture — **ineligible** | `claim_strength === 'ineligible'` | [`getEmailCaptureTrigger`](src/lib/claims/email-capture-trigger.ts) |
| Email capture — **exempt-only** | Every `claim_subjects` row has `is_exempt = true` (≥1 subject) | Same file |
| Email capture — **notify me** | User clicks **Notify me** on `/check` (`notify_me_cta` source) | [`CheckOutcomePanel`](src/components/check-outcome-panel.tsx) |
| Marketing **consent** | Opt-in checkbox; **placeholder** legal copy | [`MARKETING_CONSENT_*`](src/lib/waitlist/constants.ts) — replace after legal review |

**User-facing limit messages:** [`RATE_LIMIT_USER_MESSAGE`](src/lib/rate-limit/constants.ts), [`WAITLIST_RATE_LIMIT_USER_MESSAGE`](src/lib/rate-limit/constants.ts).

**Open questions still tied to these defaults:** “Anonymous attempt limits” and final marketing consent text in `task_manager.md` → Open questions.

## 2026-05-15 (Phase 2.5–2.6 — account wall + post-login merge)

- **Account wall (§2.5):** [`AccountWall`](src/components/account-wall.tsx) + [`CheckOutcomePanel`](src/components/check-outcome-panel.tsx) on [`/check`](src/app/check/page.tsx); full-page [`/check/account-required`](src/app/check/account-required/page.tsx); [`GET /api/claims/anonymous/status`](src/app/api/claims/anonymous/status/route.ts). Gated placeholders under [`src/app/(post-check)/`](src/app/(post-check)/) with [`enforcePostCheckAccess`](src/lib/claims/enforce-post-check-access.ts). Deep links use `claim` UUID query only ([`gated-routes.ts`](src/lib/claims/gated-routes.ts)).
- **Post-login merge (§2.6):** [`mergeAnonymousDraftOnLogin`](src/lib/claims/merge-anonymous-draft-on-login.ts) — collision abandons anonymous draft when user already has an owned `draft`; `ensurePublicUserRow` before attach; [`resolvePostMergeRedirectPath`](src/lib/claims/post-merge-redirect.ts) in auth callback. Vitest: [`merge-anonymous-draft-on-login.test.ts`](src/lib/claims/merge-anonymous-draft-on-login.test.ts), [`gated-routes.test.ts`](src/lib/claims/gated-routes.test.ts), [`post-merge-redirect.test.ts`](src/lib/claims/post-merge-redirect.test.ts).

## 2026-05-15 (Phase 2.3–2.4 — cookie bootstrap + route fixes)

- Hardened anonymous session minting: [`attachAnonymousSessionCookieIfNeeded`](src/lib/anonymous-session.ts) runs from [`src/lib/supabase/proxy.ts`](src/lib/supabase/proxy.ts) **before** the Supabase env early-return (so `/check` gets `rb_anonymous_sid` even when public env vars are missing). Added [`POST /api/session/anonymous`](src/app/api/session/anonymous/route.ts) and [`CheckSessionBootstrap`](src/components/check-session-bootstrap.tsx) on [`/check`](src/app/check/page.tsx) as a client fallback via `Set-Cookie`.
- Removed `export const runtime = "nodejs"` from route handlers — incompatible with `nextConfig.cacheComponents` (fixes dev/build 500 on [`/api/claims/anonymous`](src/app/api/claims/anonymous/route.ts) and [`/auth/callback`](src/app/auth/callback/route.ts)).
- README anonymous-funnel section updated (bootstrap API, DevTools note, local verification). Verified: `POST /api/claims/anonymous` with `rb_anonymous_sid` returns `{ claim_id }` when `SUPABASE_SECRET_KEY` is set.

## 2026-05-14 (Supabase secret API key)

- Replaced `src/lib/supabase/service-role.ts` with [`src/lib/supabase/admin.ts`](src/lib/supabase/admin.ts): prefer **`SUPABASE_SECRET_KEY`** (`sb_secret_…`); legacy **`SUPABASE_SERVICE_ROLE_KEY`** remains a fallback. `createAdminClient()` powers anonymous claims and post-login merge. README and `.env.example` updated per [Supabase API keys](https://supabase.com/docs/guides/api/api-keys).

## 2026-05-14 (Phase 2.3–2.4 — anonymous session + server claims)

- Completed `task_manager.md` §2.3–§2.4: HTTP-only **`rb_anonymous_sid`** cookie (30-day, `SameSite=Lax`, `Secure` in production) minted on [`/check`](src/app/check/page.tsx) via [`src/lib/supabase/proxy.ts`](src/lib/supabase/proxy.ts); helpers in [`src/lib/anonymous-session.ts`](src/lib/anonymous-session.ts). [`POST /api/claims/anonymous`](src/app/api/claims/anonymous/route.ts) + [`createOrGetActiveClaimForSession`](src/lib/claims/create-or-get-active-claim-for-session.ts) + [`src/lib/supabase/service-role.ts`](src/lib/supabase/service-role.ts) for service-role inserts; Vitest in [`create-or-get-active-claim-for-session.test.ts`](src/lib/claims/create-or-get-active-claim-for-session.test.ts). Post-login draft merge + cookie clear in [`src/app/auth/callback/route.ts`](src/app/auth/callback/route.ts) via [`mergeAnonymousDraftOnLogin`](src/lib/claims/merge-anonymous-draft-on-login.ts). README documents the funnel and env expectations.

## 2026-05-14 (Phase 2 — Cache Components / blocking-route)

- Resolved Next.js 16 [blocking-route](https://nextjs.org/docs/messages/blocking-route) / Cache Components dev overlay for `/login` and `/protected`: [`src/app/login/page.tsx`](src/app/login/page.tsx) now unwraps the `searchParams` promise with `.then()` inside `<Suspense>` (per Next.js 16.2 streaming docs); added [`src/app/login/loading.tsx`](src/app/login/loading.tsx) and [`src/app/protected/loading.tsx`](src/app/protected/loading.tsx); moved the authenticated shell to [`src/app/protected/protected-shell-with-auth.tsx`](src/app/protected/protected-shell-with-auth.tsx) so [`src/app/protected/layout.tsx`](src/app/protected/layout.tsx) only composes Suspense + fallback. README “Next.js 16 — Cache Components” section documents the pattern and restart guidance.

## 2026-05-14 (Phase 2 — Next.js Suspense + PKCE recovery)

- Fixed Next.js 16 “blocking route” / Cache Components warnings: `/login` reads `searchParams` inside `<Suspense>` (`src/app/login/page.tsx`); `/protected` calls `requireUser()` / `cookies()` inside `<Suspense>` (`src/app/protected/layout.tsx`). Documented **§2.1.5** assumption (dashboard must list every preview URL; Site URL should be origin-only) and **§2.2** interim `isSuccessfulQuery` note in `README.md` and `task_manager.md`. `src/lib/supabase/proxy.ts` now forwards `GET /` or `GET /protected` with `?code=` to `/auth/callback` so PKCE exchange runs when Auth URL configuration sends the code to the wrong path.

## 2026-05-15

- Completed Phase 1 §1.11 and §1.12 in `task_manager.md`. Added `supabase/migrations/20260515103000_leads_firm_portal_rls.sql` (`firm_users_select_self`, `law_firms_select_for_member`, `leads_select_consumer_own`, `leads_select_firm_assigned`) and applied with Supabase MCP. Checked in `src/types/database.ts` from `supabase gen types typescript`, wired `SupabaseClient<Database>` through `src/lib/supabase/server.ts`, `client.ts`, and `proxy.ts`, aligned `src/test-utils/mockSupabaseClient.ts`, and added optional-live `src/lib/supabase/rls-smoke.test.ts`. Updated `README.md` for RLS patterns, v0.2 policy state, type regen command, and Vitest env vars.

## 2026-05-14 (Phase 2.1–2.2)

- Phase 2 §2.1–§2.2 in `task_manager.md`: magic-link `/login` (`src/app/login/page.tsx`, `src/components/magic-link-login-form.tsx`), PKCE `GET /auth/callback` (`src/app/auth/callback/route.ts`), `requireUser` (`src/lib/supabase/require-user.ts`) wired into `src/app/protected/layout.tsx`, proxy anonymous redirect to `/login` (`src/lib/supabase/proxy.ts`), logout + nav links aligned, and provisional `isSuccessfulQuery` with Vitest (`src/lib/claims/successful-query.ts`, `successful-query.test.ts`). README documents Auth URL configuration (Site URL + `/auth/callback` allow list) and the successful-query module pointer.

## 2026-05-14

- Added `public.letters` (PRD columns plus `claim_subject_id`, `demand_scenario` with check constraint, partial unique index on `stripe_payment_intent_id`, ownership RLS for `authenticated`, explicit `GRANT`s) via `supabase/migrations/20260514190900_letters.sql`; applied with Supabase MCP. Documented PDF object key convention `letters/{user_id}/{letter_id}.pdf` in `README.md`. Added v0.2 tables `public.law_firms`, `public.firm_users` (nullable `auth_user_id` → `auth.users`), and `public.leads` (status / `claim_strength` checks, `updated_at` trigger) via `20260514190600_law_firms.sql`, `20260514190700_firm_users.sql`, and `20260514190800_leads.sql`; **RLS on with no policies** (default deny for clients until §1.11 firm policies). Marked Phase 1 §1.9 and §1.10 complete in `task_manager.md`.
- Added `public.dnc_check_results` and `public.claim_events` (PRD columns, FKs to `claims` / `claim_subjects` as applicable, timeline index on `claim_events`, column comments for nullable DNC semantics, RLS via owned `claims`, explicit `GRANT`s) via `supabase/migrations/20260514180400_dnc_check_results.sql` and `20260514180500_claim_events.sql`; applied with Supabase MCP. Added `src/lib/constants/claimEvent.ts` (and unit test) for `event_type` and `source` strings. Marked Phase 1 §1.7 and §1.8 complete in `task_manager.md`; updated `README.md` table inventory.
- Added `public.claims` and `public.claim_subjects` (PRD columns, FKs, partial unique index for anonymous sessions, `public.set_updated_at` trigger on claims, RLS for `authenticated` ownership / parent-claim inheritance, explicit `GRANT`s) via `supabase/migrations/20260514180200_claims.sql` and `20260514180300_claim_subjects.sql`; applied with Supabase MCP. Added `src/lib/constants/claimSubject.ts` (and unit test) for `call_category` values. Marked Phase 1 §1.5 and §1.6 complete in `task_manager.md`; updated `README.md` table inventory.
- Added `public.violation_types` and `public.users` (FK to `auth.users`, RLS, auth sync trigger, explicit Data API `GRANT`s) via `supabase/migrations/20260514180000_violation_types.sql` and `20260514180100_public_users.sql`; applied to the hosted project with Supabase MCP. Documented Supabase **public schema / Data API** grant rollout (May 30 / Oct 30, 2026) and Security Advisor in `README.md`. Marked Phase 1 §1.3 and §1.4 complete in `task_manager.md`.
- Documented the RingBounty hosted Supabase **project ref** and migration workflow in `README.md` (dashboard SQL Editor apply order; optional `supabase link` + `supabase db push` when CLI is adopted). Added `supabase/migrations/20260514143000_enable_pgcrypto.sql` as the first versioned migration. Removed unused `supabase/config.toml` so the repo does not imply a required local CLI stack.

## 2026-05-13

- Added root app shell (`SiteShell`: header landmark, single `<main>`, global disclaimer footer), RingBounty default metadata, and claim-strength semantic colors (`success`, `warning`, `caution`, `danger`) in `globals.css` / `tailwind.config.ts`. Pointed `components.json` Tailwind CSS path at `src/app/globals.css`. Adjusted home and protected layouts to avoid nested `<main>` elements.
- Added Vitest (`vitest.config.ts`, `npm run test` / `test:watch`), `src/test-utils/mockSupabaseClient.ts` placeholder typed mock, and a smoke unit test for `cn` in `src/lib/utils.test.ts`. Added Playwright (`playwright.config.ts`, `e2e/` with wiring spec and README, `npm run test:e2e`).
- Migrated ESLint to Next.js 16 flat config (`eslint/config` + `eslint-config-next` subpath imports), bumped `eslint-config-next` to 16.2.6, removed unused `@eslint/eslintrc`, fixed `theme-switcher` hydration guard for `react-hooks/set-state-in-effect`, and added GitHub Actions CI for lint, typecheck, and unit tests.
- Pinned `next`, `react`, `react-dom`, `@supabase/supabase-js`, and `@supabase/ssr` to explicit versions; documented Node 20.9+ and environment variables in the README; added `engines.node`; expanded `.gitignore` for Playwright output paths and stopped ignoring `task_manager.md` / `CHANGELOG.md` so they can be versioned; removed unused `SUPABASE_DB` placeholder from `.env.example`.
- Added Husky and lint-staged pre-commit tooling for staged ESLint fixes and full TypeScript checks.

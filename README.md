<a href="https://demo-nextjs-with-supabase.vercel.app/">
  <img alt="Next.js and Supabase Starter Kit - the fastest way to build apps with Next.js and Supabase" src="https://demo-nextjs-with-supabase.vercel.app/opengraph-image.png">
  <h1 align="center">Next.js and Supabase Starter Kit</h1>
</a>

<p align="center">
 The fastest way to build apps with Next.js and Supabase
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo"><strong>Demo</strong></a> ·
  <a href="#deploy-to-vercel"><strong>Deploy to Vercel</strong></a> ·
  <a href="#clone-and-run-locally"><strong>Clone and run locally</strong></a> ·
  <a href="#feedback-and-issues"><strong>Feedback and issues</strong></a>
  <a href="#more-supabase-examples"><strong>More Examples</strong></a>
</p>
<br/>

## Features

- Works across the entire [Next.js](https://nextjs.org) stack
  - App Router
  - Pages Router
  - Proxy
  - Client
  - Server
  - It just works!
- supabase-ssr. A package to configure Supabase Auth to use cookies
- Password-based authentication block installed via the [Supabase UI Library](https://supabase.com/ui/docs/nextjs/password-based-auth)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)
- Optional deployment with [Supabase Vercel Integration and Vercel deploy](#deploy-your-own)
  - Environment variables automatically assigned to Vercel project

## Demo

You can view a fully working demo at [demo-nextjs-with-supabase.vercel.app](https://demo-nextjs-with-supabase.vercel.app/).

## Deploy to Vercel

Vercel deployment will guide you through creating a Supabase account and project.

After installation of the Supabase integration, all relevant environment variables will be assigned to the project so the deployment is fully functioning.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&project-name=nextjs-with-supabase&repository-name=nextjs-with-supabase&demo-title=nextjs-with-supabase&demo-description=This+starter+configures+Supabase+Auth+to+use+cookies%2C+making+the+user%27s+session+available+throughout+the+entire+Next.js+app+-+Client+Components%2C+Server+Components%2C+Route+Handlers%2C+Server+Actions+and+Middleware.&demo-url=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2F&external-id=https%3A%2F%2Fgithub.com%2Fvercel%2Fnext.js%2Ftree%2Fcanary%2Fexamples%2Fwith-supabase&demo-image=https%3A%2F%2Fdemo-nextjs-with-supabase.vercel.app%2Fopengraph-image.png)

The above will also clone the Starter kit to your GitHub, you can clone that locally and develop locally.

If you wish to just develop locally and not deploy to Vercel, [follow the steps below](#clone-and-run-locally).

## Requirements

- **Node.js** 20.9.0 or newer. Next.js 16 [dropped Node.js 18](https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/upgrading/version-16.mdx); use a current Node 20 or 22 release.
- **npm** 10 or newer is recommended (bundled with current Node installers).

The repo root `package.json` includes an `engines.node` field that matches this minimum.

## Environment variables

### Required for local development

| Name | Purpose |
|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used by the browser and server Supabase clients. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon or publishable key (public configuration for the client; still not a password—rotate from the dashboard if leaked). |

Create `.env.local` from `.env.example` and set values from your [Supabase project API settings](https://supabase.com/dashboard/project/_/settings/api).

### Auth routes (RingBounty)

| Route | Purpose |
|-------|---------|
| [`/login`](src/app/login/page.tsx) (+ [`loading.tsx`](src/app/login/loading.tsx)) | Magic link (email OTP): sends a sign-in link via `signInWithOtp` → user lands on `/auth/callback` for PKCE `code` exchange. Uses `searchParams.then(…)` inside `<Suspense>` for Cache Components. |
| [`/auth/callback`](src/app/auth/callback/route.ts) | Server route: `exchangeCodeForSession` then redirect (cookies set on the redirect response). |
| `/auth/login`, `/auth/sign-up`, … | Starter **email + password** flows from the template. |

In the Supabase dashboard, open **Authentication → URL configuration** for project [`nktlhjjeqwpubzlvjpjv`](https://supabase.com/dashboard/project/nktlhjjeqwpubzlvjpjv/auth/url-configuration) and set:

- **Site URL** — e.g. `http://localhost:3000` for local dev; production `https://ringbounty.com` (or your canonical host).
- **Additional redirect URLs** — include `http://localhost:3000/auth/callback`, `https://ringbounty.com/auth/callback`, and **every** preview or staging origin you use (full origin + `/auth/callback`), or Supabase will reject the link or bounce users to a path that never exchanges the PKCE `code`.

**Assumption / risk (§2.1.5):** README cannot configure the hosted project for you. If magic links fail or email confirmations land on e.g. `/protected?code=…` instead of `/auth/callback`, check **Site URL** (should be the site **origin**, not a deep link like `/protected`) and expand **Additional redirect URLs** as above.

**Auth redirects (PKCE recovery):** [`proxy.ts`](proxy.ts) forwards requests that arrive with `?code=` on `/` or `/protected` to [`/auth/callback`](src/app/auth/callback/route.ts) so `exchangeCodeForSession` still runs when dashboard URL settings are slightly off.

The app’s root [`proxy.ts`](proxy.ts) refreshes the session (see [`src/lib/supabase/proxy.ts`](src/lib/supabase/proxy.ts)); unauthenticated visitors are sent to `/login`.

### Public marketing (Phase §3.1–§3.6)

| Route | Purpose |
|-------|---------|
| [`/`](src/app/page.tsx) | Landing: TCPA informational hero, trust strip, CTAs to `/check` and `/how-it-works`, PRD disclaimer footer. |
| [`/how-it-works`](src/app/how-it-works/page.tsx) | Product flow overview (check → qualify → results → attorney referral) — **TODO §3.7:** update page copy from legacy pay/letter flow. |
| [`/faq`](src/app/faq/page.tsx) | Objection-handling FAQ (cost, legality, outcomes, timing, DNC, attorneys) with non-advice reminders. |
| [`/privacy`](src/app/privacy/page.tsx) | Plain-English privacy policy (collection, retention, third parties, CCPA, anonymous vs signed-in lifecycle). |
| [`/terms`](src/app/terms/page.tsx) | Terms of service (eligibility 18+, acceptable use, liability draft) — **TODO §3.7:** attorney lead-sharing terms. |

### SEO landing pages (Phase §11.2)

| Route | Purpose |
|-------|---------|
| [`/tcpa-violation-checker`](src/app/tcpa-violation-checker/page.tsx) | Primary TCPA screening landing (FAQ JSON-LD) |
| [`/spam-call-compensation`](src/app/spam-call-compensation/page.tsx) | Statutory damages framing |
| [`/do-not-call-registry-violation`](src/app/do-not-call-registry-violation/page.tsx) | DNC / registry framing |
| [`/robocall-lawsuit`](src/app/robocall-lawsuit/page.tsx) | Lawsuit / attorney discussion framing |

`/tcpa-demand-letter` **301** → `/tcpa-violation-checker` (no DIY letter promise). Copy: [`seo-landing-pages.ts`](src/lib/marketing/seo-landing-pages.ts). Footer **Resources** links in [`marketing-page-footer.tsx`](src/components/marketing/marketing-page-footer.tsx).

### SEO URL strategy & technical SEO (Phase §11.1, §11.4)

| Piece | Location |
|-------|----------|
| URL policy | [`docs/seo.md`](docs/seo.md) — company pages `/{slug}-spam-calls` (§11.3 content deferred) |
| Company template | [`src/app/[slug]/page.tsx`](src/app/[slug]/page.tsx) + [`company-pages.ts`](src/lib/seo/company-pages.ts) |
| Sitemap / robots | [`sitemap.ts`](src/app/sitemap.ts), [`robots.ts`](src/app/robots.ts) |
| Canonical helpers | [`canonical-metadata.ts`](src/lib/seo/canonical-metadata.ts), [`site-url.ts`](src/lib/seo/site-url.ts) |
| Env | `NEXT_PUBLIC_SITE_URL` (see [`.env.example`](.env.example)) |

Shared copy lives in [`src/lib/marketing/`](src/lib/marketing/) (`constants.ts`, `faq.ts`, `privacy.ts`, `terms.ts`). The PRD §3 disclaimer is rendered by [`DisclaimerBanner`](src/components/marketing/disclaimer-banner.tsx) (global site footer, marketing pages, [`/check` layout](src/app/check/layout.tsx), [`(post-check)` layout](src/app/(post-check)/layout.tsx), and [`/protected`](src/app/protected/protected-shell-with-auth.tsx)). `/guide` will reuse the same component when Phase 10 ships.

Marketing UI: [`src/components/marketing/`](src/components/marketing/). Unauthenticated access to marketing routes is allowed via [`isPublicMarketingPath`](src/lib/marketing/public-routes.ts) in [`src/lib/supabase/proxy.ts`](src/lib/supabase/proxy.ts).

### Anonymous funnel (Phase §2.3–§2.4)

| Piece | Location / notes |
|-------|-------------------|
| `/check` layout (§4.1–§4.6, §5.4) | Mobile-first funnel at [`src/app/check/page.tsx`](src/app/check/page.tsx): [`CheckPageShell`](src/components/check/check-page-shell.tsx); step state + §4.2 checklist + §4.3–§4.4 masked US NANP rows (max 10; add/remove; inline length / pattern validation; duplicate hints) in [`CheckFunnelClient`](src/components/check/check-funnel-client.tsx). Helpers + server validation in [`us-phone.ts`](src/lib/check/us-phone.ts): `normalizeUsPhoneToE164`, `parseAndDedupePhoneNumberPayload`. §4.6: skeleton rows while submit runs; **Retry with backoff** after failures; per-number **`number_checks`** from [`spam-check-pipeline.ts`](src/lib/spam/spam-check-pipeline.ts) (Nomorobo + Twilio via §5.4; provider ids `nomorobo` / `twilio`; HTTP skipped when env flags/keys off) surfaces partial provider failures without blocking the whole response when persistence succeeds. [`POST /api/check/submit`](src/app/api/check/submit/route.ts): optional `{ "phone_numbers": ["+12125550199", …], "phone_displays": ["(212) 555-0199", …] }` (validated E.164 + aligned optional mask strings); replaces `claim_subjects` on the session’s anonymous **`claims`** row, runs spam checks, updates **`claim_subjects`** spam columns + **`claim_events`**, and sets **`status: 'checking'`** after the first persisted subject batch (starts as **`draft`**); see [`anonymous-funnel-claim-status.ts`](src/lib/claims/anonymous-funnel-claim-status.ts) + migration `20260515160000_claims_status_checking.sql`. JSON includes `claim_id`, `claim_subject_ids` (PostgreSQL multi-row insert order), and **`number_checks`** when phones were posted. Empty POST body still supported for the outcome panel preview. Successful funnel submit dispatches `RB_CHECK_SUBMITTED_EVENT` ([`constants.ts`](src/lib/check/constants.ts)) so [`CheckOutcomePanel`](src/components/check-outcome-panel.tsx) refetches gate status. |
| Session cookie | Name **`rb_anonymous_sid`**: HTTP-only, `SameSite=Lax`, **30-day** `maxAge`, `Secure` when `NODE_ENV === "production"`. Minted on [`/check`](src/app/check/page.tsx) by [`src/lib/supabase/proxy.ts`](src/lib/supabase/proxy.ts) and, if needed, by [`POST /api/session/anonymous`](src/app/api/session/anonymous/route.ts) via [`CheckSessionBootstrap`](src/components/check-session-bootstrap.tsx) (UUID v4). |
| Bootstrap claim (server-only) | [`POST /api/claims/anonymous`](src/app/api/claims/anonymous/route.ts) — requires a valid session cookie; uses [`createOrGetActiveClaimForSession`](src/lib/claims/create-or-get-active-claim-for-session.ts) with [`createAdminClient`](src/lib/supabase/admin.ts) and a **secret API key**. Returns JSON `{ claim_id }`. |
| Gate status API | [`GET /api/claims/anonymous/status`](src/app/api/claims/anonymous/status/route.ts) — `{ claim_id, is_successful_query, requires_account_wall }` for [`CheckOutcomePanel`](src/components/check-outcome-panel.tsx). |
| Account wall (§2.5) | When `requires_account_wall`, [`AccountWall`](src/components/account-wall.tsx) on [`/check`](src/app/check/page.tsx) or [`/check/account-required`](src/app/check/account-required/page.tsx). Login deep link: `/login?next=/results?claim=<uuid>` (claim id only, no PII). |
| Gated routes (§2.5.2) | Anonymous users with a successful query are redirected to the account wall from [`/results`](src/app/(post-check)/results/page.tsx), [`/summary`](src/app/(post-check)/summary/page.tsx), [`/qualify/[claimSubjectId]`](src/app/(post-check)/qualify/[claimSubjectId]/page.tsx), [`/letter/...`](src/app/(post-check)/letter/[[...slug]]/page.tsx) via [`enforcePostCheckAccess`](src/lib/claims/enforce-post-check-access.ts). Proxy allows these paths through [`isAnonymousAllowedPath`](src/lib/anonymous-session.ts). |
| Post-login merge (§2.6) | After PKCE, [`src/app/auth/callback/route.ts`](src/app/auth/callback/route.ts) calls [`mergeAnonymousDraftOnLogin`](src/lib/claims/merge-anonymous-draft-on-login.ts) (collision: abandon anonymous draft if user already owns a `draft` claim), clears `rb_anonymous_sid`, redirects via [`resolvePostMergeRedirectPath`](src/lib/claims/post-merge-redirect.ts) to `/results?claim=…` (and `subject=` when one subject exists). |
| Rate limiting (§2.7) | In-DB sliding windows via `public.consume_rate_limit` ([`src/lib/rate-limit/`](src/lib/rate-limit/)). [`POST /api/check/submit`](src/app/api/check/submit/route.ts) enforces **10 checks/hour per `rb_anonymous_sid`** and **30/hour per IP** (tunable in [`constants.ts`](src/lib/rate-limit/constants.ts)); returns **429** with friendly copy. CAPTCHA stub: [`src/lib/rate-limit/captcha.ts`](src/lib/rate-limit/captcha.ts). Phase 4 phone-check should call the same helper before expensive work. |
| Email capture (§2.8) | [`EmailCaptureModal`](src/components/email-capture-modal.tsx) on [`/check`](src/app/check/page.tsx) when gate status reports `show_email_capture` (ineligible or all-exempt subjects). [`POST /api/waitlist`](src/app/api/waitlist/route.ts) → `public.newsletter_waitlist` (admin insert, SHA-256 email dedupe). Explicit **Notify me** CTA opens overlay with `notify_me_cta` source. Marketing consent uses **placeholder** copy in [`src/lib/waitlist/constants.ts`](src/lib/waitlist/constants.ts) until legal review. Waitlist signups: **5/hour per IP**. |

**Tunable §2.7–2.8 defaults** (limits, triggers, consent): see [CHANGELOG → MVP defaults (2.7-2.8)](CHANGELOG.md#mvp-defaults-27-28).

**`/check` §5.4–5.7 spam pipeline:** [`spam-check-pipeline.ts`](src/lib/spam/spam-check-pipeline.ts) orchestrates Nomorobo (primary) + Twilio (secondary), merges per PRD §7, and persists to `claim_subjects` / `claim_events`. **§5.5:** merged `call_category` in [`EXEMPT_CATEGORIES`](src/lib/constants/exempt-categories.ts) sets `is_exempt` + `exempt_reason` (DNC / registered-agent steps should skip exempt subjects in Phase 6). **§5.6:** non-exempt rows with no spam hit show soft-warning copy ([`no-spam-hit.ts`](src/lib/constants/no-spam-hit.ts)) but still allow qualification; PRD §8 matrix tiers (+30 / +15 / 0) are derived in [`spam-db-matrix-signal.ts`](src/lib/scoring/spam-db-matrix-signal.ts) and stored on `claim_events` as `spam_db_matrix_tier` / `spam_db_matrix_points`. **§5.7:** debt-collection category shows FDCPA informational copy ([`fdcpa-debt-collection.ts`](src/lib/constants/fdcpa-debt-collection.ts)), blocks TCPA letter path (`claim_events.tcpa_letter_blocked = fdcpa_debt_collection`), and offers optional waitlist capture (`debt_collection_interest`) when all subjects are debt-collection exempt — copy does not promise a future product. Submit JSON `number_checks[].is_exempt`, `is_known_spammer`, and `is_debt_collection` drive per-number messaging on `/check`. Enable providers with `SPAM_PROVIDER_NOMOROBO_ENABLED` / `SPAM_PROVIDER_TWILIO_ENABLED` plus API keys; without them, adapters return **skipped** results (no outbound HTTP). [`parallel-check-pipeline-stub.ts`](src/lib/check/parallel-check-pipeline-stub.ts) remains for stub-only unit tests. Loading UI is skeleton until one **`POST /api/check/submit`** completes (**not streaming**).

**§5.7 / §6.6:** Debt collection is detected via the same §5.5 category aliases (`Debt Collector`, `debt_collector`, etc.). `claim_events.tcpa_letter_blocked` (legacy key) records blocks; [`canReferToAttorney`](src/lib/claims/can-refer-to-attorney.ts) enforces the same rules for attorney referral. Waitlist source `debt_collection_interest` appears only when every subject is exempt and debt-collection; mixed exempt claims still use `exempt_only`.

**Phase 6.1–6.2 — federal DNC (manual attestation only):**

| Topic | Decision |
|-------|----------|
| **Registry API / vendor scrub** | **Not used** — FTC [Q&A #13](https://www.ftc.gov/business-guidance/resources/qa-telemarketers-sellers-about-dnc-provisions-tsr-0) limits National Registry access to TSR compliance / preventing telemarketing calls, not consumer claim scoring. No FTC SAN, no RealPhoneValidation-style scrub for v0.1. See [`docs/spikes/20260516190000-federal-dnc-access.md`](docs/spikes/20260516190000-federal-dnc-access.md). |
| **FTC `dnc-complaints` API** | Complaint data only — **not** registry lookup. |
| **`/check`** | [`FEDERAL_DNC_UNAVAILABLE_USER_MESSAGE`](src/lib/constants/federal-dnc-unavailable.ts); submit JSON includes `federal_dnc` (status unavailable). No automated +25. |
| **Qualification (§6.2 + §7.1–7.6)** | [`/qualify/[claimSubjectId]`](src/app/(post-check)/qualify/[claimSubjectId]/page.tsx) — federal DNC pre-gate ([`FederalDncAttestationForm`](src/components/qualify/federal-dnc-attestation-form.tsx)), then wizard screens **1–5** via `?step=` ([`qualify-step.ts`](src/lib/qualify/qualify-step.ts), [`load-qualify-context.ts`](src/lib/qualify/load-qualify-context.ts)). **Step 1 (§7.2):** consent / EBR Q1–Q3 ([`Screen1ConsentForm`](src/components/qualify/screen-1-consent-form.tsx), [`POST /api/qualify/screen-1`](src/app/api/qualify/screen-1/route.ts)). **Step 2 (§7.3):** stop request Q4–Q7 ([`Screen2StopRequestForm`](src/components/qualify/screen-2-stop-request-form.tsx), [`POST /api/qualify/screen-2`](src/app/api/qualify/screen-2/route.ts)) → `claim_events` + `dnc_check_results.internal_dnc_*`. **Step 3 (§7.4):** call details Q8–Q12 ([`Screen3CallDetailsForm`](src/components/qualify/screen-3-call-details-form.tsx), [`POST /api/qualify/screen-3`](src/app/api/qualify/screen-3/route.ts)) → `claim_events`; Q10 triggers [`recomputeFederalDncEligibility`](src/lib/dnc/recompute-federal-dnc-eligibility.ts). **Step 4 (§7.5):** voicemail + Q13 company + Q14 evidence ([`Screen4CompanyForm`](src/components/qualify/screen-4-company-form.tsx), [`POST /api/qualify/voicemail`](src/app/api/qualify/voicemail/route.ts), [`POST /api/qualify/screen-4`](src/app/api/qualify/screen-4/route.ts)) → clears `company_unidentified` block. **Step 5 (§7.6):** mobile vs home/landline attestation ([`Screen5LineTypeForm`](src/components/qualify/screen-5-line-type-form.tsx), [`POST /api/qualify/screen-5`](src/app/api/qualify/screen-5/route.ts)) → `claim_events` key `line_type`; TCPA cite mapping in [`line-type-statute.ts`](src/lib/tcpa/line-type-statute.ts) (user attestation only — not inferred from Twilio). Optional `?claim=` must match subject's claim. Resume: `claim_events` key `qualify_step_resume`. [`POST /api/qualify/federal-dnc`](src/app/api/qualify/federal-dnc/route.ts) → `dnc_check_results` / `claim_events`. |
| **31-day rule** | [`computeFederalDncEligibleFromDates`](src/lib/dnc/federal-dnc-eligibility.ts); persisted via [`persist-federal-dnc-attestation.ts`](src/lib/dnc/persist-federal-dnc-attestation.ts). `federal_dnc_eligible` stays null until earliest call date (Phase 7 Q10) or optional `earliest_call_date` on submit. |
| **Scoring** | PRD +25 only when `attestedByUser` + eligible ([`federal-dnc-matrix-signal.ts`](src/lib/scoring/federal-dnc-matrix-signal.ts)). |
| **Optional evidence (§6.2.4)** | Optional FTC confirmation screenshot on qualify form → private `claim-evidence` bucket (`{user_id}/{claim_id}/{subject_id}/federal-dnc-confirmation.{ext}`); path in `claim_subjects.metadata` + `claim_events`. Max 5 MB; JPEG/PNG/WebP/GIF. Not required; not verified by RingBounty. |

**Phase 6.3 — state DNC (scaffold only):**

| Topic | Decision |
|-------|----------|
| **Registry states** | Eleven states per PRD §7 Step 4 — [`state-dnc-registries.ts`](src/lib/constants/state-dnc-registries.ts) (IN, TX, WY, CO, LA, MS, MO, OK, OR, PA, TN). |
| **v0.1 APIs** | **Not integrated** — `state_dnc_registered` / `state_dnc_checked_at` stay null; no +10 scoring until a real lookup persists `state_dnc_registered: true` ([`state-dnc-matrix-signal.ts`](src/lib/scoring/state-dnc-matrix-signal.ts)). |
| **Persistence** | On federal attestation save, [`deriveStateDncScaffoldFields`](src/lib/dnc/scaffold-state-dnc-row.ts) writes `state_dnc_applicable` + `state_dnc_state` from `public.users.state`. |
| **Qualify UI** | [`StateDncComingSoon`](src/components/qualify/state-dnc-coming-soon.tsx) when the user's state has a registry. |
| **`/check`** | Submit JSON includes `state_dnc` (generic “coming soon” copy; state-specific after profile is set). |
| **§13.7 scaffold** | Per-state flags `STATE_DNC_{CODE}_ENABLED` ([`state-dnc-flags.ts`](src/lib/dnc/state-dnc-flags.ts)); lookup orchestration ([`run-state-dnc-lookup.ts`](src/lib/dnc/run-state-dnc-lookup.ts)) + persist ([`persist-state-dnc-lookup.ts`](src/lib/dnc/persist-state-dnc-lookup.ts)). Spike: [`docs/spikes/20260517300000-state-dnc-integrations.md`](docs/spikes/20260517300000-state-dnc-integrations.md). **No state API shipped** — flags stay off until vendor + counsel. |

**Phase 6.4 — company identification:**

**Locked policy:** [`docs/company-identification-strategy.md`](docs/company-identification-strategy.md) — spoofed robocall numbers often cannot be mapped to a legal defendant from the number alone; **Q13 + future voicemail** are the reliable path.

| Topic | Decision |
|-------|----------|
| **`company_identified = true`** | **Nomorobo `reported_name`**, **voicemail transcription** (§7.5.4), or **user Q13** (`user_input`, §7.5.1). |
| **Twilio Lookup v2** | Spam score + line type / VOIP (carrier intelligence). **CNAM → `company_name_hint` only** — does not set `company_identified`. |
| **Whitepages (§6.4.2)** | Optional after spam merge (`WHITEPAGES_*` env). [`GET /v2/person?phone=…`](https://api.whitepages.com/docs/documentation/person-search/reverse-phone-lookup) → **hint only**, not `company_identified`. Spike: [`docs/spikes/20260516220000-whitepages-company-lookup.md`](docs/spikes/20260516220000-whitepages-company-lookup.md). |
| **FTC complaints** | **Deferred** (bulk index v1, not live API). [`docs/spikes/20260516210000-ftc-complaints-company-lookup.md`](docs/spikes/20260516210000-ftc-complaints-company-lookup.md). |
| **Referral block (§6.4.3)** | `tcpa_letter_blocked = company_unidentified` until identified; enforce via §6.6 [`canReferToAttorney`](src/lib/claims/can-refer-to-attorney.ts). |
| **`/check` (§6.4.4)** | Unidentified copy, “Company identified” when Nomorobo hits, **unverified CNAM/hint** line when `company_name_hint` present. |
| **Qualify §7.5** | **Voicemail** mp3/m4a/wav → OpenRouter STT + extract ([`openrouter-voicemail.ts`](src/lib/company/openrouter-voicemail.ts), `OPENROUTER_API_KEY`) → `voicemail_transcription`. **Q13** company + optional callback/pitch → [`persistUserCompanyIdentification`](src/lib/company/persist-user-company-identification.ts). **Q14** `has_additional_evidence` for attorney PDF (§13.2). **Soft verify:** OpenCorporates → `user_input_verified` / `user_input_unverified`; warning [`COMPANY_NAME_UNVERIFIED_WARNING`](src/lib/constants/company-name-verification.ts). Spike: [`docs/spikes/20260516230000-voicemail-company-identification.md`](docs/spikes/20260516230000-voicemail-company-identification.md). |
| **Qualify §7.6** | Explicit attestation: mobile vs home/landline → `line_type` on `claim_events`. [`mapLineTypeToTcpaSubsection`](src/lib/tcpa/line-type-statute.ts) maps to §227(b)(1)(A)(iii) or (B) for scoring and attorney evidence — not demand letters. |
| **Qualify §7.7** | Screen 5 final submit → `claims.status` = `qualified`, `claim_events` `scoring_status=pending` ([`complete-qualify-claim.ts`](src/lib/qualify/complete-qualify-claim.ts)) → [`/results?claim=`](src/app/(post-check)/results/page.tsx). Attorney CTA when [`canReferToAttorney`](src/lib/claims/can-refer-to-attorney.ts) ([`AttorneyReferralCta`](src/components/results/attorney-referral-cta.tsx)). [`/summary`](src/app/(post-check)/summary/page.tsx) redirects to `/results` (no letter cart in v0.1). |
| **Scoring §8.1** | PRD §8 matrix: [`computeStrengthMatrix`](src/lib/scoring/strength-matrix.ts) + [`strength-matrix-constants.ts`](src/lib/scoring/strength-matrix-constants.ts); per-signal spam/DNC helpers unchanged. Persisted on qualify complete (§8.5). |
| **Scoring §8.2** | SOL: [`computeSolFlags`](src/lib/scoring/compute-sol-flags.ts) + [`getStateSolYears`](src/lib/scoring/state-sol-years.ts); persisted on Screen 3 ([`persistSolFlags`](src/lib/scoring/persist-sol-flags.ts)). `/results` [`SolWarningBanner`](src/components/results/sol-warning-banner.tsx) when `likely_time_barred` — informational only (does not block attorney referral per §6.6). |
| **Scoring §8.3** | Valuation: [`computeValuation`](src/lib/scoring/compute-valuation.ts) + [`computeViolationCounts`](src/lib/scoring/compute-violation-counts.ts) (PRD §11; integer cents). [`buildValuationDisplayCaveat`](src/lib/scoring/compute-valuation.ts) appends SOL note when time-barred. |
| **Results §8.4** | [`/results`](src/app/(post-check)/results/page.tsx): [`loadResultsPageContext`](src/lib/claims/load-results-page-context.ts) — strength, valuation, referral gates; subject cards + strength header + valuation panel + ineligible/email capture + attorney CTA ([`AttorneyReferralCta`](src/components/results/attorney-referral-cta.tsx) → `/attorney-connect` when eligible). |
| **Scoring §8.5** | [`persistClaimScoring`](src/lib/scoring/persist-claim-scoring.ts) on Screen 5 final submit + backfill when `claim_strength` is null on `/results`; writes `claims` columns + `value_calculated` audit ([`scoring-claim-events.ts`](src/lib/scoring/scoring-claim-events.ts)). Shared engine: [`computeClaimScoring`](src/lib/scoring/compute-claim-scoring.ts). |
| **Attorney §13.1** | [`/attorney-connect?claim=`](src/app/(post-check)/attorney-connect/page.tsx) — expectations + consent → [`POST /api/leads/attorney-referral`](src/app/api/leads/attorney-referral/route.ts) creates `leads` (`status=new`), records eligible `claim_subjects` on `claim_events`, runs evidence PDF job (§13.2). Confirmation email via Resend when `RESEND_API_KEY` is set. |
| **Attorney §13.2** | [`runEvidencePdfJob`](src/lib/leads/run-evidence-pdf-job.ts) → [`generateAndUploadEvidencePdf`](src/lib/leads/evidence-pdf/generate-and-upload-evidence-pdf.ts) (pdfkit) → private `lead-packages` bucket; `leads.evidence_pdf_url` = `lead-packages:{leadId}/evidence-package.pdf`. `/results` shows [`AttorneySharingChecklist`](src/components/results/attorney-sharing-checklist.tsx). |
| **Firm §13.3** | Stripe **Connect Express** ([`constants.ts`](src/lib/stripe/connect/constants.ts)). Linked firm user → [`POST /api/firms/stripe-connect/onboarding`](src/app/api/firms/stripe-connect/onboarding/route.ts) returns Account Link URL; `law_firms.stripe_connect_*` updated by [`POST /api/webhooks/stripe`](src/app/api/webhooks/stripe/route.ts) (`account.updated`). Requires Stripe Dashboard Connect enabled + `STRIPE_*` env vars (see `.env.example`). |
| **Firm §13.4** | In-app portal at [`/firms/leads`](src/app/firms/(portal)/leads/page.tsx) (same deploy; optional host `firms.*` via [`apply-firm-portal-proxy.ts`](src/lib/firms/apply-firm-portal-proxy.ts)). Magic-link login at `/firms/login`; [`linkFirmUserOnLogin`](src/lib/firms/link-firm-user-on-login.ts) binds `firm_users.auth_user_id` after invite ([`POST /api/firms/invite`](src/app/api/firms/invite/route.ts) when `FIRM_OPS_INVITE_SECRET` is set). **Pool model:** RLS policy `leads_select_firm_pool` + assigned rows; filters (state, min value, strength); Realtime INSERT on `leads`. |
| **Firm §13.5** | **Accept + pay:** [`POST /api/firms/leads/[leadId]/accept`](src/app/api/firms/leads/[leadId]/accept/route.ts) → Stripe Checkout (direct charge on firm Connect account; platform `application_fee_amount` = lead fee). Webhook [`payment_intent.succeeded`](src/app/api/webhooks/stripe/route.ts) sets `leads.status=accepted` and unlocks consumer PII (`users_select_for_firm_assigned_lead`, `claim_subjects_select_for_firm_assigned_lead`). **Decline:** [`POST /api/firms/leads/[leadId]/decline`](src/app/api/firms/leads/[leadId]/decline/route.ts) → `firm_lead_declines` (per-firm hide). Requires `STRIPE_*` + completed Connect onboarding (`stripe_connect_charges_enabled`). |
| **Firm §13.6** | **Status updates:** [`PATCH /api/firms/leads/[leadId]/status`](src/app/api/firms/leads/[leadId]/status/route.ts) (`contacted` / `retained` / `closed` + timestamps). Consumers see status on [`/results`](src/app/(post-check)/results/page.tsx) via `leads_select_consumer_own`. **Reminder cron:** [`POST /api/cron/firm-lead-status-reminder`](src/app/api/cron/firm-lead-status-reminder/route.ts) with `Authorization: Bearer $CRON_SECRET` (5+ days in `accepted` with no update). |
| **§13.7** | State DNC spike + per-state env flags + `dnc_check_results` normalization scaffold ([`docs/spikes/20260517300000-state-dnc-integrations.md`](docs/spikes/20260517300000-state-dnc-integrations.md)). Enable one state at a time after real `StateDncProvider` + legal sign-off. |
| **Next** | §13.8 disputes placeholder. |

**Phase 6.5 — registered agent lookup:**

| Topic | Decision |
|-------|----------|
| **When** | After `company_identified` + `company_name` when `users.state` is known (spam persist or Q13). Anonymous `/check` skips OpenCorporates until profile state exists. |
| **API** | [OpenCorporates v0.4](https://api.opencorporates.com/documentation/API-Reference) — company search → company detail → agent officer. |
| **Fallback** | In-state search, then `us_de` / `us_nv` / `us_wy`, then US-wide. |
| **Persist** | `registered_agent_name`, `registered_agent_address`, `registered_agent_lookup_source` on `claim_subjects`. |
| **Manual** | SOS business-search links per top states — [`registered-agent-lookup.ts`](src/lib/constants/registered-agent-lookup.ts). |
| **Rate limit** | 6 lookups per anonymous session per hour (`opencorporates_lookup`). |
| **Env** | `OPENCORPORATES_API_TOKEN` in `.env.local`. |

**v0.1 product direction (2026-05-17):** No DIY demand letters or consumer Stripe Checkout. Users **gather evidence** on `/check` and `/qualify`, see **informational claim strength** on `/results` (Phase 8), and may **connect with an attorney** when [`canReferToAttorney`](src/lib/claims/can-refer-to-attorney.ts) passes (Phase 6.6). Phases 9–10 (letter purchase, PDF generation) are cancelled; see `task_manager.md`.

**Phase 6.6 — attorney referral eligibility:**

| Topic | Decision |
|-------|----------|
| **Gate** | [`canReferToAttorney(claim, subject)`](src/lib/claims/can-refer-to-attorney.ts) → `{ ok, reasons[] }`; server routes use [`assertCanReferToAttorney`](src/lib/claims/can-refer-to-attorney.ts) before creating `leads` (§13.1). |
| **Blocks** | `is_exempt`, `claim_strength === ineligible`, unidentified company (§6.4.3), debt collection / FDCPA ([`fdcpa-debt-collection.ts`](src/lib/constants/fdcpa-debt-collection.ts)). |
| **Does not block** | Federal DNC attestation gaps, SOL warnings — informational on `/results` only. |
| **Legacy** | `canPurchaseLetter` aliases `canReferToAttorney`; `tcpa_letter_blocked` event key unchanged. |
| **Reason codes** | [`attorney-referral.ts`](src/lib/constants/attorney-referral.ts) — `exempt`, `claim_ineligible`, `company_unidentified`, `fdcpa_debt_collection`. |

Applies to the **consumer’s receiving number**, not spammer numbers entered on `/check`.

Set **`SUPABASE_SECRET_KEY`** (`sb_secret_…` from [Settings → API Keys](https://supabase.com/dashboard/project/nktlhjjeqwpubzlvjpjv/settings/api-keys)) in `.env.local` (server-only; never commit) for the anonymous API and merge path. Supabase [recommends secret keys](https://supabase.com/docs/guides/api/api-keys) over the legacy JWT `service_role` key (browser-blocked, easier rotation). Legacy **`SUPABASE_SERVICE_ROLE_KEY`** still works as a fallback. Without either key, `POST /api/claims/anonymous` responds **503** and merge is skipped.

**Finding the cookie in DevTools:** Application → Cookies → **`http://localhost:3000`** (match your dev port). `rb_anonymous_sid` is **HttpOnly** (visible in DevTools, not in `document.cookie`). After visiting `/check`, you should also see Network → **`anonymous`** (`POST /api/session/anonymous`, 200).

**Local smoke test** (replace with your cookie value from DevTools):

```bash
curl -X POST http://localhost:3000/api/claims/anonymous \
  -H "Cookie: rb_anonymous_sid=YOUR-UUID-HERE"
```

Expected: `{"claim_id":"<uuid>"}`. Route handlers must not set `export const runtime = "nodejs"` while **Cache Components** is enabled (see README “Next.js 16 — Cache Components”).

### Optional (Vercel / hosting)

| Name | Purpose |
|------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin for sitemap, `metadataBase`, and canonical links (e.g. `https://ringbounty.com`). Preferred over `VERCEL_URL` (§11.4). |
| `VERCEL_URL` | Hostname for the current deployment; fallback for `metadataBase` when `NEXT_PUBLIC_SITE_URL` is unset. |
| `VERCEL_ENV` | `development`, `preview`, or `production` on Vercel. Preview sets `robots.txt` to `disallow: /` (§11.4.2). |
| `VERCEL_PROJECT_PRODUCTION_URL` | Canonical production hostname on Vercel. |

### Planned integrations (names only; not required for the baseline app)

These are reserved for upcoming work—do not commit real secrets:

- `SUPABASE_SECRET_KEY` — server-only secret API key (`sb_secret_…`): Phase §2.3–§2.4 anonymous **`POST /api/claims/anonymous`**, merge after magic link in **`/auth/callback`**, and optional `rls-smoke.test.ts` admin-key branch. Legacy `SUPABASE_SERVICE_ROLE_KEY` is accepted if unset.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe payments and webhooks.
- `OPENROUTER_API_KEY` — voicemail STT + company extraction on qualify step 4 (§7.5.4); optional — manual Q13 still works without it.
- `NOMOROBO_API_KEY` — **Nomorobo Enterprise** primary spam / robocall lookup (`GET https://api.nomorobo.com/v2/check`, `X-API-Key`). See [`nomorobo-spam-provider.ts`](src/lib/spam/nomorobo-spam-provider.ts), `docs/Nomorobo Enterprise API Documentation.pdf`, [Nomorobo API](https://www.nomorobo.com/api/). Enable with `SPAM_PROVIDER_NOMOROBO_ENABLED`.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` — **Twilio Lookup v2** secondary corroboration (`Fields=phone_number_quality_score,caller_name,line_type_intelligence`; [PRD §7](prd.md), [Lookup v2](https://www.twilio.com/docs/lookup/v2-api), [`twilio-lookup-spam-provider.ts`](src/lib/spam/twilio-lookup-spam-provider.ts)). Enable with `SPAM_PROVIDER_TWILIO_ENABLED`.
- `SPAM_PROVIDER_NOMOROBO_ENABLED`, `SPAM_PROVIDER_TWILIO_ENABLED` — boolean strings (`true` / `false` / `1` / `yes`) toggling each adapter in the Phase 5 orchestrator; see [`src/lib/spam/provider-flags.ts`](src/lib/spam/provider-flags.ts). Defaults to off when unset.
- `OPENCORPORATES_API_TOKEN` — company search + registered agent lookup (§6.5, §7.5.1b soft verify).
- `FEDERAL_DNC_AUTOMATED_ENABLED` — **leave off** unless counsel approves registry API access (not planned for v0.1 attestation path). Do not use FTC `dnc-complaints` for `federal_dnc_*` fields.

## Supabase project (RingBounty)

RingBounty uses a **hosted** Supabase project (no local Supabase stack required for day-to-day app development).

| | |
|--|--|
| **Project ref** | `nktlhjjeqwpubzlvjpjv` |
| **Dashboard** | [Project home](https://supabase.com/dashboard/project/nktlhjjeqwpubzlvjpjv) |
| **API URL** (same value as `NEXT_PUBLIC_SUPABASE_URL`) | `https://nktlhjjeqwpubzlvjpjv.supabase.co` |

The project ref is public metadata (it appears in URLs); it is **not** a secret. Database password, service role keys, and access tokens must never be committed.

### Database migrations

Versioned SQL lives in [`supabase/migrations/`](supabase/migrations/). **Naming:** `YYYYMMDDHHMMSS_short_description.sql` (UTC wall-clock timestamp + snake_case description), e.g. `20260514143000_enable_pgcrypto.sql`, so files sort in apply order.

**Apply migrations without the Supabase CLI (current default):**

1. Open the [SQL Editor](https://supabase.com/dashboard/project/nktlhjjeqwpubzlvjpjv/sql/new) for this project.
2. Run each file’s contents **in timestamp order** (oldest first). Prefer a new query tab per migration so you can keep an audit trail of what ran.

**Optional — Supabase CLI later:** When you adopt the CLI, run `supabase login`, then `supabase link --project-ref nktlhjjeqwpubzlvjpjv`, then push pending files with `supabase db push`. For a **local** database only, `supabase migration up` / `supabase db reset` apply what is under `supabase/migrations/` per the [Supabase CLI database docs](https://supabase.com/docs/guides/deployment/database-migrations).

### Public schema and the Data API (PostgREST / supabase-js)

Supabase is tightening defaults: **new** tables in `public` may not be exposed to the Data API until you grant explicitly to `anon`, `authenticated`, and (for admin paths) `service_role`. Rollout: **May 30, 2026** for new projects; **October 30, 2026** for existing projects. If a grant is missing, PostgREST often returns **42501** with a suggested `GRANT` in the message.

RingBounty migrations that create app tables include **RLS** plus **explicit `GRANT`s** so `supabase-js` and REST keep working after those dates. When you add a new `public` table, mirror that pattern (RLS policies + grants per role). Use the dashboard [Security Advisor](https://supabase.com/dashboard/project/nktlhjjeqwpubzlvjpjv/advisors/security) to audit access.

**Current reference tables (see `prd.md` section 5):** `public.violation_types` (seeded catalog; read-only for `anon` / `authenticated`), `public.users` (profile row per auth user; `select` / `update` own row only; rows synced from `auth.users` via trigger), `public.claims` (consumer claim; `authenticated` DML on own `user_id` rows only; no `anon` grant—anonymous funnel uses the service role on the server), `public.claim_subjects` (child rows per claim; RLS via **EXISTS** subquery to owned `claims`), `public.dnc_check_results` (federal/state/internal DNC columns per claim or subject; same **EXISTS** pattern to owned `claims`), `public.claim_events` (append-only-style `event_type` / `key` / `value` / `source` log; same **EXISTS** pattern to owned `claims`), `public.letters` (purchased letter rows; optional `claim_subject_id`, `demand_scenario`; RLS so `authenticated` users only see rows where `user_id = auth.uid()`), **`public.rate_limit_buckets`** + RPC **`consume_rate_limit`** (service_role only; §2.7), **`public.newsletter_waitlist`** (service_role insert only; §2.8), and v0.2 referral tables **`public.law_firms`**, **`public.firm_users`**, **`public.leads`** (`authenticated` **select** only for linked firm users / assigned leads per `supabase/migrations/20260515103000_leads_firm_portal_rls.sql`; **insert/update/delete** for those tables still require **`service_role`** until firm-portal writes ship). `call_category` app constants live in [`src/lib/constants/claimSubject.ts`](src/lib/constants/claimSubject.ts). `claim_events` literals live in [`src/lib/constants/claimEvent.ts`](src/lib/constants/claimEvent.ts).

**Generated `Database` types:** [`src/types/database.ts`](src/types/database.ts) is produced from the hosted schema, for example:

```bash
npx supabase gen types typescript --project-id nktlhjjeqwpubzlvjpjv 2>/dev/null > src/types/database.ts
```

Re-run after migrations so `SupabaseClient<Database>` in [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts), [`src/lib/supabase/client.ts`](src/lib/supabase/client.ts), and [`src/lib/supabase/proxy.ts`](src/lib/supabase/proxy.ts) stays accurate.

**Optional RLS smoke tests (Vitest):** [`src/lib/supabase/rls-smoke.test.ts`](src/lib/supabase/rls-smoke.test.ts) runs live checks when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set (e.g. in `.env.local`). Set **`SUPABASE_SECRET_KEY`** (server-only; never commit) to enable the admin-key branch, and **`VITEST_SUPABASE_USER_ACCESS_TOKEN`** (short-lived user JWT from the dashboard or a test login) to exercise the “authenticated JWT in `Authorization` header” branch. CI skips these when env vars are absent.

**Letter PDF storage (convention):** when you add a Supabase Storage bucket for generated PDFs, store objects at **`letters/{user_id}/{letter_id}.pdf`** (replace with your bucket name prefix if you namespace buckets differently). `public.letters.pdf_url` should point at the final public or signed URL returned to the client.

## Clone and run locally

1. You'll first need a Supabase project which can be made [via the Supabase dashboard](https://database.new)

2. Create a Next.js app using the Supabase Starter template npx command

   ```bash
   npx create-next-app --example with-supabase with-supabase-app
   ```

   ```bash
   yarn create next-app --example with-supabase with-supabase-app
   ```

   ```bash
   pnpm create next-app --example with-supabase with-supabase-app
   ```

3. Use `cd` to change into the app's directory

   ```bash
   cd with-supabase-app
   ```

4. Rename `.env.example` to `.env.local` and update the following:

  ```env
  NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[INSERT SUPABASE PROJECT API PUBLISHABLE OR ANON KEY]
  ```
  > [!NOTE]
  > This example uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, which refers to Supabase's new **publishable** key format.
  > Both legacy **anon** keys and new **publishable** keys can be used with this variable name during the transition period. Supabase's dashboard may show `NEXT_PUBLIC_SUPABASE_ANON_KEY`; its value can be used in this example.
  > See the [full announcement](https://github.com/orgs/supabase/discussions/29260) for more information.

  Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be found in [your Supabase project's API settings](https://supabase.com/dashboard/project/_?showConnect=true)

5. You can now run the Next.js local development server:

   ```bash
   npm run dev
   ```

   The starter kit should now be running on [localhost:3000](http://localhost:3000/).

6. This template comes with the default shadcn/ui style initialized. If you instead want other ui.shadcn styles, delete `components.json` and [re-install shadcn/ui](https://ui.shadcn.com/docs/installation/next)

> Check out [the docs for Local Development](https://supabase.com/docs/guides/getting-started/local-development) to also run Supabase locally.

## Developer workflow

Husky installs Git hooks through the `prepare` script after `npm install`.

Before each commit, `.husky/pre-commit` runs `npx lint-staged` against staged JavaScript and TypeScript files, then runs `npm run typecheck` for the full TypeScript project. `lint-staged` currently runs ESLint with `--fix` on staged `*.{js,jsx,ts,tsx}` files.

In an emergency, hooks can be skipped with `HUSKY=0 git commit ...`, but this should be reserved for broken work-in-progress commits and followed by a normal passing commit as soon as possible.

## Next.js 16 — Cache Components (`blocking-route`)

This app ships on **Next.js 16.2.x** with **Cache Components** enabled. Request-time APIs (`cookies()`, `headers()`, and **awaiting** page `searchParams` / `params` promises in the wrong place) can trigger the dev overlay [“Route … was accessed outside `<Suspense>`”](https://nextjs.org/docs/messages/blocking-route). RingBounty follows the **Next.js 16.2** streaming guidance:

- **[`/login`](src/app/login/page.tsx)** — Sync page component; `<Suspense>` wraps `searchParams.then(({ next }) => …)` so the magic-link form receives `next` without blocking the segment. **[`src/app/login/loading.tsx`](src/app/login/loading.tsx)** provides the route `loading` fallback.
- **[`/protected`](src/app/protected/layout.tsx)** — Layout wraps **[`ProtectedShellWithAuth`](src/app/protected/protected-shell-with-auth.tsx)** (which calls `requireUser()` → Supabase server client → `cookies()`) in `<Suspense>` with a shell fallback. **[`src/app/protected/loading.tsx`](src/app/protected/loading.tsx)** covers the segment during navigation.
- **Post-check funnel** ([`/results`](src/app/(post-check)/results/page.tsx), [`/qualify/...`](src/app/(post-check)/qualify/[claimSubjectId]/page.tsx), [`/letter/...`](src/app/(post-check)/letter/[[...slug]]/page.tsx), [`/summary`](src/app/(post-check)/summary/page.tsx)) — Sync page shell + inner async component inside `<Suspense>` so [`enforcePostCheckAccess`](src/lib/claims/enforce-post-check-access.ts) (`cookies()`) does not block the static shell. Segment fallback: [`src/app/(post-check)/loading.tsx`](src/app/(post-check)/loading.tsx).
- **[`/[slug]`](src/app/[slug]/page.tsx)** (company SEO, §11.3) — `connection()` + `<Suspense>` until `COMPANY_SEO_PAGES` has entries (Cache Components forbids empty `generateStaticParams`).

After changing these files, **restart `npm run dev`** if Turbopack still shows a stale stack trace.

## App shell and semantic colors

- **Layout:** The root layout wraps all routes in [`src/components/layout/site-shell.tsx`](src/components/layout/site-shell.tsx): a top **header** landmark (reserved for global navigation), a single document **main** around page content, and a slim **footer** for the global “not legal advice” notice. Nested routes should use `<section>` / `<div>` for inner regions so there is only one `<main>` per page.
- **Shadcn / Tailwind:** CLI config lives in [`components.json`](components.json); the Tailwind entrypoint is [`src/app/globals.css`](src/app/globals.css) (aligned with the `src/app` tree).
- **Claim-strength tokens:** CSS variables `--success`, `--warning`, `--caution`, and `--danger` (with matching `*-foreground` values) are defined for light and dark themes and exposed as Tailwind colors `success`, `warning`, `caution`, and `danger` in [`tailwind.config.ts`](tailwind.config.ts). Use them for outcome / claim-strength UI (green → yellow → orange → red). `destructive` remains the default shadcn control color for destructive actions.

## Continuous integration

GitHub Actions runs on every pull request and on pushes to `main` (see `.github/workflows/ci.yml`). It installs dependencies with `npm ci`, then runs `npm run lint`, `npm run typecheck`, and `npm run test` (Vitest unit tests). This complements Husky and does not replace local checks before you commit.

## Testing

### Unit tests (Vitest)

- `npm run test` — run the Vitest suite once (CI uses this).
- `npm run test:watch` — watch mode while developing.

Specs live next to source files as `*.test.ts` / `*.test.tsx` under `src/`. Shared Supabase test doubles live in [`src/test-utils/mockSupabaseClient.ts`](src/test-utils/mockSupabaseClient.ts) (uses generated [`src/types/database.ts`](src/types/database.ts)).

**Successful query gate (anonymous funnel):** interim predicate and tests live in [`src/lib/claims/successful-query.ts`](src/lib/claims/successful-query.ts) (`isSuccessfulQuery`). **Anonymous claim bootstrap:** [`create-or-get-active-claim-for-session.ts`](src/lib/claims/create-or-get-active-claim-for-session.ts) (+ [`create-or-get-active-claim-for-session.test.ts`](src/lib/claims/create-or-get-active-claim-for-session.test.ts)). **Rate limit + waitlist:** [`src/lib/rate-limit/`](src/lib/rate-limit/), [`src/lib/waitlist/`](src/lib/waitlist/), [`email-capture-trigger.test.ts`](src/lib/claims/email-capture-trigger.test.ts).

**Assumption / risk (§2.2):** The predicate is **interim** until the **“Successful query” exact predicate** open question in [`task_manager.md`](task_manager.md) is decided. When product locks the rule, update the module spec in `successful-query.ts` and [`successful-query.test.ts`](src/lib/claims/successful-query.test.ts) together so marketing and enforcement stay aligned.

### End-to-end tests (Playwright)

- One-time browser install: `npx playwright install` (or `npx playwright install chromium` for a smaller footprint).
- `npm run test:e2e` — run Playwright against specs in [`e2e/`](e2e/).

The included wiring spec does not start Next.js. Specs that hit `http://127.0.0.1:3000` need `npm run dev` in another terminal (or a `webServer` block in `playwright.config.ts`). See [`e2e/README.md`](e2e/README.md).

## Feedback and issues

Please file feedback and issues over on the [Supabase GitHub org](https://github.com/supabase/supabase/issues/new/choose).

## More Supabase examples

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Cookie-based Auth and the Next.js 13 App Router (free course)](https://youtube.com/playlist?list=PL5S4mPUpp4OtMhpnp93EFSo42iQ40XjbF)
- [Supabase Auth and the Next.js App Router](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs)

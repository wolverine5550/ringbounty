# Changelog

## 2026-05-19 (Company ID — CI-6.1 callback recursive lookup)

### Infra (follows parent agent completion)

- **CI-6.1.1** — Migration [`20260520101500_company_intel_callback_recursive.sql`](supabase/migrations/20260520101500_company_intel_callback_recursive.sql): `parent_run_id`, `run_metadata` on `company_intelligence_runs`; [`enqueue-callback-intelligence-runs.ts`](src/lib/company-intelligence/enqueue-callback-intelligence-runs.ts) enqueues up to two child pending runs (no CI-1.4 rate-limit consumption).
- **CI-6.1.2** — Callback child runs use agent-only Round 2 (`isCallbackLookup` skips parent Lane A reuse).
- **CI-6.1.3** — [`apply-callback-resolution-to-parent.ts`](src/lib/company-intelligence/apply-callback-resolution-to-parent.ts): substantive callback hit → parent `company_name_suggested` at confidence 90 (`callback_confirmed`); parent `run_metadata.callback_resolved_from`.
- **CI-6.1.4** — [`callback-recursive-policy.ts`](src/lib/company-intelligence/callback-recursive-policy.ts): max 2 callbacks; one recursion level (children do not enqueue further).

## 2026-05-19 (Company ID — CI-5.1 complaint site scrape)

### Infra (default off)

- **CI-5.1.1** — Legal spike [`docs/spikes/20260519210000-complaint-site-scrape-legal-review.md`](docs/spikes/20260519210000-complaint-site-scrape-legal-review.md): conditional go behind feature flag; counsel sign-off pending.
- **CI-5.1.2** — [`scrape-complaint-sites.ts`](src/lib/company-intelligence/sources/scrape-complaint-sites.ts): 800notes / WhoCalledMe / CallerComplaints comment extraction; feeds OpenRouter synthesis after SerpAPI.
- **CI-5.1.3** — `COMPANY_INTEL_SCRAPE_ENABLED=false` in [`.env.example`](.env.example).
- **CI-5.1.4** — Vitest HTML fixtures under `sources/fixtures/` (no live scrape in CI).

## 2026-05-19 (Company ID — CI-4.3 cost logging)

### Infra

- **CI-4.3.1** — Migration [`20260519200000_company_intel_run_cost.sql`](supabase/migrations/20260519200000_company_intel_run_cost.sql): `company_intelligence_runs.estimated_cost_cents`, `apis_called[]`; computed in [`company-intel-run-cost.ts`](src/lib/company-intelligence/company-intel-run-cost.ts) from billable SerpAPI + OpenRouter HTTP attempts.
- **CI-4.3.1** — `claim_events` audit keys `company_intel_estimated_cost_cents`, `company_intel_apis_called` on agent completion ([`company-intelligence-events.ts`](src/lib/company-intelligence/company-intelligence-events.ts)).
- **CI-4.3.2** — README ops monitoring thresholds for daily Lane B API spend (staging tune).
- Env overrides: `COMPANY_INTEL_SERPAPI_COST_CENTS`, `COMPANY_INTEL_OPENROUTER_COST_CENTS` in [`.env.example`](.env.example).

## 2026-05-19 (Company ID — CI-4.2 OpenRouter synthesis Round 4)

### Infra (uses existing `OPENROUTER_API_KEY`)

- **CI-4.2.1** — [`synthesize-company-from-sources.ts`](src/lib/company-intelligence/synthesize-company-from-sources.ts): structured JSON synthesis from accumulated `sources[]` + SerpAPI snippets; Round 4 wired in [`run-company-intelligence-agent.ts`](src/lib/company-intelligence/run-company-intelligence-agent.ts).
- **CI-4.2.2** — Env `COMPANY_INTEL_OPENROUTER_MODEL` (default `anthropic/claude-sonnet-4`) in [`.env.example`](.env.example).
- **CI-4.2.3** — `parseAndValidateSynthesisJson` + one retry on malformed model JSON.
- **CI-4.2.4** — Vitest: [`synthesize-company-from-sources.test.ts`](src/lib/company-intelligence/synthesize-company-from-sources.test.ts), orchestrator integration test.
- Persists `openrouter_prompt` / `openrouter_response` on `company_intelligence_runs` when synthesis succeeds.

## 2026-05-19 (Company ID — CI-4.1 SerpAPI Round 3)

### Infra (flags off by default)

- **CI-4.1.1** — Env `SERPAPI_API_KEY`, `COMPANY_INTEL_SERP_ENABLED` in [`.env.example`](.env.example).
- **CI-4.1.2** — [`serpapi-complaint-search.ts`](src/lib/company-intelligence/sources/serpapi-complaint-search.ts): Google complaint query with `num=10`; wired into Round 3 of [`run-company-intelligence-agent.ts`](src/lib/company-intelligence/run-company-intelligence-agent.ts) when paid rounds allowed (**CI-P.5**).
- **CI-4.1.3** — Snippets stored in `company_intelligence_runs.raw_results.round_3.serpapi`; `redactPhonePiiForLog` on errors (no phone in logs).
- **CI-4.1.4** — Vitest: [`serpapi-complaint-search.test.ts`](src/lib/company-intelligence/sources/serpapi-complaint-search.test.ts), orchestrator integration test.
- Round 4 OpenRouter synthesis shipped in **CI-4.2** (separate changelog entry).

## 2026-05-19 (Company ID — CI-3.3 orchestrator tests)

### Tests + docs (no new runtime behavior)

- **CI-3.3.1** — UNKNOWN CNAM → `buildSynthesisFromSourceHits` path (null `companyName`, suggest reasoning).
- **CI-3.3.2** — Path A FTC seed short-circuit before round 3 / SerpAPI.
- **CI-3.3.3** — v1 persist never sets `company_identified` (even `ftc_enforcement` tier).
- **CI-3.3.4** — Anonymous round-3 audit `anonymous_paid_rounds_disabled`.
- Docs: [`check_cadence.md`](docs/check_cadence.md) §3.5 Lane B orchestrator diagram; [`company-identification-strategy.md`](docs/company-identification-strategy.md) code map.

## 2026-05-19 (Company ID — CI-3.2 suggest-only persistence)

### Infra (flags off by default)

- **CI-3.2.1** — [`persist-company-intelligence-outcome.ts`](src/lib/company-intelligence/persist-company-intelligence-outcome.ts): suggest fields on `claim_subjects`; v1 never sets `company_identified` unless already true from Lane A / voicemail / Q13.
- **CI-3.2.2** — `claim_events` with `event_type=company_intelligence`: `company_intelligence_completed`, `company_name_suggested`, `company_identification_source=company_intelligence` ([`company-intelligence-events.ts`](src/lib/company-intelligence/company-intelligence-events.ts), [`claimEvent.ts`](src/lib/constants/claimEvent.ts)).
- **CI-3.2.3** — v2 auto-promote when `COMPANY_INTEL_AUTO_PROMOTE_ENABLED` + `shouldPromoteToIdentified` (CI-P.4.3 tiers).
- **CI-3.2.4** — OpenCorporates RA via [`persistRegisteredAgentLookup`](src/lib/company/persist-registered-agent-lookup.ts) only on v2 auto-promote with substantive name + user state.
- **CI-2.2.3** — Seed write-back wired on agent completion when synthesis has substantive name.
- Vitest: [`persist-company-intelligence-outcome.test.ts`](src/lib/company-intelligence/persist-company-intelligence-outcome.test.ts).

## 2026-05-19 (Company ID — CI-3.1 orchestrator core)

### Infra (flags off by default; CI-4 paid rounds not wired yet)

- **CI-3.1.1** — Multi-round orchestrator in [`run-company-intelligence-agent.ts`](src/lib/company-intelligence/run-company-intelligence-agent.ts): accumulates `allSources` / `rounds` per round.
- **CI-3.1.2** — Round 1: local `seed_violations` (CI-2.2).
- **CI-3.1.3** — Round 2: reuse `metadata.spam_providers` + Whitepages hints from check submit ([`lane-a-spam-providers.ts`](src/lib/company-intelligence/sources/lane-a-spam-providers.ts)); no Nomorobo HTTP; stale when `claim_subjects.created_at` &gt; 24h (configurable).
- **CI-3.1.4** — Short-circuit when confidence ≥ `COMPANY_INTEL_SHORT_CIRCUIT_THRESHOLD` (default 70).
- **CI-3.1.5** — Worker persists `sources_queried`, `raw_results`, and suggest fields on `claim_subjects` ([`process-company-intelligence-run.ts`](src/lib/company-intelligence/process-company-intelligence-run.ts)).
- Vitest: `orchestrator-policy.test.ts`, `orchestrator-short-circuit.test.ts`, `lane-a-spam-providers.test.ts`, updated `run-company-intelligence-agent.test.ts`.

## 2026-05-19 (Company ID — CI-2.2 seed Round 1 lookup)

### Infra (requires `seed_violations` data from CI-2.1 ETL)

- **CI-2.2.1** — [`querySeedViolations`](src/lib/company-intelligence/sources/seed-violations.ts): local `seed_violations` lookup by E.164.
- **CI-2.2.2** — Round 1 short-circuit in [`run-company-intelligence-agent.ts`](src/lib/company-intelligence/run-company-intelligence-agent.ts): Path A (count &gt; 50 + substantive name) → confidence 85, `skipPaidRounds`; Path B → FTC category suggest only, paid rounds still allowed.
- **CI-2.2.3** — [`writeBackSeedViolationFromAgent`](src/lib/company-intelligence/sources/seed-violations.ts) for cache compound after substantive name from later rounds (**CI-3**). Vitest: [`seed-violations.test.ts`](src/lib/company-intelligence/sources/seed-violations.test.ts), [`run-company-intelligence-agent.test.ts`](src/lib/company-intelligence/run-company-intelligence-agent.test.ts).

## 2026-05-19 (Company ID — CI-2.1 FTC bulk ETL script)

### Infra (no prod ingest until CI-P.2.4 counsel sign-off)

- **CI-2.1.1** — [`scripts/etl/ftc-dnc-complaints-ingest.ts`](scripts/etl/ftc-dnc-complaints-ingest.ts): download or read FTC daily `DNC_Complaint_Numbers_YYYY-MM-DD.csv`; `npm run etl:ftc-dnc`.
- **CI-2.1.2** — Parse + aggregate Path B ([`src/lib/company-intelligence/etl/`](src/lib/company-intelligence/etl/)): E.164 normalize, modal `Subject`, robocall majority, skip empty/invalid phones; no consumer PII.
- **CI-2.1.3** — Upsert `seed_violations` (`source=ftc_complaint`, confidence buckets 10–99 medium / 100+ high). Vitest: `etl/*.test.ts`.
- **CI-2.1.4** — Legal/data-use header in script (FTC terms, retention, unverified complaints).
- **CI-2.1.5** — README manual run + rolling-window refresh notes.

## 2026-05-19 (Company ID — CI-1.4 enqueue rate limits)

### Infra (flags off by default)

- **CI-1.4.1** — [`constants.ts`](src/lib/rate-limit/constants.ts): `company_intelligence_enqueue` action — **10/hour per anonymous session**, **30/hour per IP** (tunable when SerpAPI ships).
- **CI-1.4.2** — [`assert-company-intelligence-enqueue-allowed.ts`](src/lib/rate-limit/assert-company-intelligence-enqueue-allowed.ts): skip Lane B insert when capped; `[rate-limit]` incident log + `company_intel_enqueue_rate_limited` JSON (does not block `/check`). Vitest: [`assert-company-intelligence-enqueue-allowed.test.ts`](src/lib/rate-limit/assert-company-intelligence-enqueue-allowed.test.ts).
- **CI-1.4.3** — Documented Turnstile (**O1**) dependency before marketing traffic + full agent scale (complements hourly caps; [`README.md`](README.md)).

## 2026-05-19 (Company ID — CI-1.3 cron drain)

### Infra (agent stub until CI-3; flags off by default)

- **CI-1.3.1** — [`GET /api/cron/company-intelligence-drain`](src/app/api/cron/company-intelligence-drain/route.ts) (`CRON_SECRET`): claims up to N pending runs via `claim_company_intelligence_runs` and processes each. [`vercel.json`](vercel.json) schedules every 2 minutes.
- **CI-1.3.3** — After enqueue, fail-open `fetch` to internal worker with `{ run_id }` ([`trigger-company-intelligence-run.ts`](src/lib/company-intelligence/trigger-company-intelligence-run.ts)); cron remains source of truth if fetch drops. Vitest: [`trigger-company-intelligence-run.test.ts`](src/lib/company-intelligence/trigger-company-intelligence-run.test.ts).

## 2026-05-19 (Company ID — CI-1.2 internal worker)

### Infra (agent stub until CI-3; flags off by default)

- **CI-1.2** — `POST /api/internal/company-intelligence/run` (`CRON_SECRET`): process `{ run_id }` or claim batch via `claim_company_intelligence_runs` RPC. Retry/backoff + terminal `failed` on errors; `company_intel_status` synced on subject. Agent entry [`run-company-intelligence-agent.ts`](src/lib/company-intelligence/run-company-intelligence-agent.ts) is a no-op stub until **CI-3**. Vitest: [`process-company-intelligence-run.test.ts`](src/lib/company-intelligence/process-company-intelligence-run.test.ts).

## 2026-05-19 (Company ID — CI-1.1 enqueue on check)

### Infra (flag off by default; no worker UX)

- **CI-1.1** — After Lane A spam persist, [`maybeEnqueueCompanyIntelligenceRun`](src/lib/company-intelligence/enqueue-company-intelligence-run.ts) inserts `company_intelligence_runs` (`pending`) and sets `claim_subjects.company_intel_status=pending` when `COMPANY_INTELLIGENCE_AGENT_ENABLED=true` and `company_identified=false` and not exempt. Fail-open (never blocks `/check`). Hook: [`spam-check-pipeline.ts`](src/lib/spam/spam-check-pipeline.ts). Vitest: [`should-enqueue-company-intelligence-run.test.ts`](src/lib/company-intelligence/should-enqueue-company-intelligence-run.test.ts), [`enqueue-company-intelligence-run.test.ts`](src/lib/company-intelligence/enqueue-company-intelligence-run.test.ts).

## 2026-05-19 (Company ID — CI-0.1 schema)

### Database (infra; no agent routes / UX yet)

- **CI-0.1.1** — `seed_violations` — proprietary phone cache (`phone_number_normalized` PK, `confidence_level`, `violation_count`, `source`, `litigation_status`, `metadata`). `service_role` only (RLS enabled, no authenticated policies).
- **CI-0.1.2** — `company_intelligence_runs` — Lane B queue + run audit (`status`, retry columns per **CI-P.6.3**, synthesis fields). RPC `claim_company_intelligence_runs(p_batch_size)` with `FOR UPDATE SKIP LOCKED`.
- **CI-0.1.3** — `claim_subjects` — `company_intel_status`, `company_intel_confidence`, `company_intel_reasoning`, `company_name_suggested` (distinct from `company_name`; suggest-only per **CI-P.4**).
- **CI-0.1.4–0.1.5** — RLS + indexes (authenticated SELECT own runs via claim; partial index on `pending`). Migration: [`supabase/migrations/20260519193000_company_intelligence_schema.sql`](supabase/migrations/20260519193000_company_intelligence_schema.sql). Types: [`src/types/database.ts`](src/types/database.ts), [`src/lib/company-intelligence/types.ts`](src/lib/company-intelligence/types.ts). **Unblocks** **CI-1** enqueue/worker, **CI-2** FTC ETL.

## 2026-05-19 (Company ID — CI-P.6 worker design)

### Policy + infra (no worker routes / migrations yet)

- **CI-P.6.1** — Cron drain must claim pending runs via `createAdminClient().rpc('claim_company_intelligence_runs')` with Postgres `FOR UPDATE SKIP LOCKED` inside a `security definer` function (same pattern as `consume_rate_limit`). PostgREST filter-only `.select().eq('status','pending')` is **not** safe for concurrent workers.
- **CI-P.6.2** — v1: **cron drain required** (1–2 min schedule); optional fail-open `fetch` from submit (**CI-1.3.3**). Cron is source of truth.
- **CI-P.6.3** — Retry policy locked: 3 attempts, exponential backoff 60s/120s/240s, 72h stale pending, 15m stale `running` reclaim. [`worker-policy.ts`](src/lib/company-intelligence/worker-policy.ts), Vitest: [`worker-policy.test.ts`](src/lib/company-intelligence/worker-policy.test.ts). Spike: [`docs/spikes/20260519160000-company-intel-worker-design.md`](docs/spikes/20260519160000-company-intel-worker-design.md). **Unblocks** **CI-0.1.2** schema + **CI-1** worker routes.

## 2026-05-19 (Company ID — CI-P.5 cost and abuse gates)

### Policy + infra (no agent worker / UX yet)

- **CI-P.5.1** — Anonymous `/check` may enqueue agent runs; **paid** rounds (SerpAPI + OpenRouter synthesis) run only when `authenticatedUserId` is set or `COMPANY_INTEL_ALLOW_ANONYMOUS_PAID_ROUNDS=true` (default off). [`paid-intel-rounds.ts`](src/lib/company-intelligence/paid-intel-rounds.ts), [`company-intelligence-flags.ts`](src/lib/company-intelligence/company-intelligence-flags.ts); Vitest: [`paid-intel-rounds.test.ts`](src/lib/company-intelligence/paid-intel-rounds.test.ts).
- **CI-P.5.2** — Documented Turnstile (**O1**) dependency before marketing traffic + full agent scale ([`company-identification-strategy.md`](docs/company-identification-strategy.md), [`check_cadence.md`](docs/check_cadence.md) §3.5, [`ongoing_task_manager.md`](docs/ongoing_task_manager.md)).
- **CI-P.5.3** — Baseline metrics SQL + prod snapshot (2026-05-19): [`docs/spikes/20260519150000-company-intel-step4-baseline-metrics.md`](docs/spikes/20260519150000-company-intel-step4-baseline-metrics.md). **Unblocks** **CI-4** paid API design (still requires **CI-1** worker in staging).

## 2026-05-19 (Company ID — CI-P.4 suggest-only v1 policy lock)

### Policy + infra (no agent worker / UX yet)

- **CI-P.4.1** — `shouldPromoteToIdentified` returns `false` unless `COMPANY_INTEL_AUTO_PROMOTE_ENABLED=true` (unset/false in production). Modules: [`company-intelligence/confidence.ts`](src/lib/company-intelligence/confidence.ts), [`company-intelligence-flags.ts`](src/lib/company-intelligence/company-intelligence-flags.ts), [`company-intelligence/types.ts`](src/lib/company-intelligence/types.ts); Vitest: [`confidence.test.ts`](src/lib/company-intelligence/confidence.test.ts).
- **CI-P.4.2** — [`docs/company-identification-strategy.md`](docs/company-identification-strategy.md): agent row in trust matrix; v1 suggest-only + v2 auto-promote table.
- **CI-P.4.3** — v2 allowlist documented (voicemail, callback-confirmed, FTC enforcement with Path A name); SerpAPI/LLM/Path B FTC never auto-promote alone.
- **Also ships early:** **CI-0.3** confidence map + aggregation (gates **CI-3.2** auto-promote). **Unblocks** **CI-3.2** v1 persistence path.

## 2026-05-19 (Company ID — CI-P.3 identification source audit)

### Planning docs (no runtime changes)

- **CI-P.3.1** — Audited `claim_events` vs `claim_subjects`: identification provenance is **events-only** (no `company_name_source` on subjects). Lane A uses `company_name_source` on `spam_db_match` (Nomorobo); qualify uses `company_identification_source` on `qualification_answer` (`user_input`, `voicemail_transcription`).
- **CI-P.3.2** — v1 agent locked: `claim_events` keys `company_intelligence_completed`, `company_name_suggested`, `company_identification_source=company_intelligence`; suggest fields on subject per **CI-0.1.3** — **no** new `claim_subjects.company_name_source` column.
- **CI-P.3.3** — [`company-identification.ts`](src/lib/constants/company-identification.ts) header documents v0.1 promoters (Nomorobo, voicemail, Q13) and agent suggest-only.
- **Spike:** [`docs/spikes/20260519140000-company-identification-source-audit.md`](docs/spikes/20260519140000-company-identification-source-audit.md). **Unblocks** **CI-3.2** event persistence design.

## 2026-05-19 (Company ID — CI-P.2 FTC bulk CSV schema, Path B)

### Planning docs (no runtime / ingest yet)

- **CI-P.1.3** — Spike outcome doc complete: [`docs/spikes/20260519120000-ftc-bulk-csv-schema-validation.md`](docs/spikes/20260519120000-ftc-bulk-csv-schema-validation.md).
- **CI-P.2** — Validated FTC daily CSV (`DNC_Complaint_Numbers_2026-05-15.csv`, ~12.9k rows / 11k unique phones / 1.3 MB): columns `Company_Phone_Number` (caller), `Subject` (category — same as live API), robocall flag; **no company/entity name column**. Complainant `Consumer_*` fields must not be ingested.
- **Path B chosen** — **CI-2** ETL will store phone + modal FTC category + complaint count in `seed_violations.metadata`; `reported_company_name` stays null; identification still requires Nomorobo / voicemail / Q13 / **CI-4** agent rounds.
- **Storage (first ingest)** — Recommend 30-day rolling aggregate (~200k–400k phones, ~60–150 MB Postgres). **CI-P.2.4** counsel checkpoint remains open before prod ingest.
- **Unblocks** — **CI-2.1** ETL design; live API spike table updated for bulk Path B.

## 2026-05-19 (Company ID — CI-P.1 doc and spike alignment)

### Planning docs (no runtime changes)

- **CI-P.1.1** — Cross-links: product spec is [`docs/claude_chat_company_finder.md`](docs/claude_chat_company_finder.md) (chat export + doc header); no remaining `company_finder.md` references in tracked docs. [`docs/check_cadence.md`](docs/check_cadence.md) §3.5 links task manager, product spec, FTC spikes, and planned Lane B agent.
- **CI-P.1.2** — FTC live API vs bulk CSV: [`docs/spikes/20260516210000-ftc-complaints-company-lookup.md`](docs/spikes/20260516210000-ftc-complaints-company-lookup.md) § CI-P.1 alignment (live `subject` = category only; do not conflate with bulk ETL).

## 2026-05-18 (Qualify UX — caller context, Screen 4 evidence uploads)

### Wizard context

- **Caller on every qualify screen** — [`QualifyPageLayout`](src/app/(post-check)/qualify/[claimSubjectId]/page.tsx) shows **Caller number you are qualifying** under the page title ([`formatQualifyEvaluatedCallerDisplay`](src/lib/qualify/constants.ts)).

### Screen 4 (company + evidence)

- **Voicemail-gated fields** — Callback number and product/pitch fields only when user answers **Yes** to having a voicemail to upload; **No** clears those values ([`screen-4-company-form.tsx`](src/components/qualify/screen-4-company-form.tsx), [`screen-4-company-identification.ts`](src/lib/qualify/screen-4-company-identification.ts)).
- **Step 5 skipped when company unknown** — Blank, `UNKNOWN`, or placeholder company names route Screen 4 → **6** (skip consent); direct navigation to `?step=5` redirects to step 6 ([`isNamedCompanyForConsent`](src/lib/qualify/format-company-consent-prompt.ts), [`resolveWizardStepAfterCompanyScreen`](src/lib/qualify/qualify-step.ts)). Step title: **Permission and prior relationship**.
- **Step 5 consent copy** — Preface no longer appends the raw company string; named companies get dynamic `{{company}}` in Q1/Q3 ([`resolveCompanyConsentLabel`](src/lib/qualify/format-company-consent-prompt.ts)).
- **Q14 copy** — Last question asks for **screenshots/notes only** (not voicemail again); wording depends on voicemail yes/no ([`buildQualifyQ14Prompt`](src/lib/constants/qualify-screen-4.ts)).
- **Q14 file uploads** — Answering **Yes** to additional evidence shows multi-file upload (JPEG/PNG/WebP/GIF/PDF/`.txt`, 5 MB each, 10 per claim) → private **`claim-evidence`** Storage via [`POST /api/qualify/additional-evidence`](src/app/api/qualify/additional-evidence/route.ts) ([`additional-call-evidence.ts`](src/lib/qualify/additional-call-evidence.ts), [`upload-additional-call-evidence.ts`](src/lib/qualify/upload-additional-call-evidence.ts)). Paths persist on `claim_events` key `additional_evidence_paths`. Migration [`20260518174500_claim_evidence_text_plain.sql`](supabase/migrations/20260518174500_claim_evidence_text_plain.sql).

## 2026-05-18 (Federal DNC — receiving line profile + account reuse)

### Receiving phone vs screened caller

- **Product fix:** Federal DNC attestation is about the **consumer’s receiving line** (cell/home), not the **spammer number** screened on `/check`. The qualify gate now labels the screened caller separately and collects **your phone that received these calls** ([`federal-dnc-attestation-form.tsx`](src/components/qualify/federal-dnc-attestation-form.tsx), copy in [`federal-dnc-attestation.ts`](src/lib/constants/federal-dnc-attestation.ts)).
- **Profile persistence:** `public.users.receiving_phone` + `receiving_phone_normalized` (migration [`20260518173000_users_receiving_phone.sql`](supabase/migrations/20260518173000_users_receiving_phone.sql)); helpers in [`receiving-phone.ts`](src/lib/users/receiving-phone.ts). Saved on [`POST /api/qualify/federal-dnc`](src/app/api/qualify/federal-dnc/route.ts) and optional capture on reuse ([`POST /api/qualify/federal-dnc/reuse-prior`](src/app/api/qualify/federal-dnc/reuse-prior/route.ts)).
- **Account-level reuse:** Prior federal DNC answers (yes/no, registration date, optional FTC PDF) reuse across **any new claim** on the same account ([`load-prior-federal-dnc-attestation.ts`](src/lib/dnc/load-prior-federal-dnc-attestation.ts), [`FederalDncAttestationGate`](src/components/qualify/federal-dnc-attestation-gate.tsx), [`reuse-federal-dnc-attestation-from-prior.ts`](src/lib/dnc/reuse-federal-dnc-attestation-from-prior.ts)) — not keyed to `claim_subjects.phone_number_normalized`.
- **UX:** Removed internal “Phase 6.2” subtitle on the federal DNC qualify page; reuse panel shows saved receiving line when known. Docs: [`check_cadence.md`](docs/check_cadence.md).

## 2026-05-18 (Pre-launch — Results qualify gate + signed-in dashboard checks)

### Results and attorney CTA

- **Attorney connect gated on qualify** — [`canShowAttorneyReferralCta`](src/lib/claims/results-qualify-gate.ts) requires `claims.status === 'qualified'` before `/results` shows attorney referral; [`QualifyContinuationCta`](src/components/results/qualify-continuation-cta.tsx) when not qualified. Evidence checklist stays on [`/attorney-connect`](src/app/(post-check)/attorney-connect/page.tsx) only.
- **Results layout** — Strength and per-number cards side-by-side ([`ResultsStrengthAndSubjects`](src/components/results/results-strength-and-subjects.tsx)); DNC summary hidden until qualification complete (`showDncSummary` on results page).

### Signed-in check submit

- **Dashboard multi-check** — Authenticated [`POST /api/check/submit`](src/app/api/check/submit/route.ts) skips anonymous “free check” 403; creates a **new claim per submit** via [`create-claim-for-authenticated-check.ts`](src/lib/claims/create-claim-for-authenticated-check.ts) (up to `CHECK_MAX_PHONE_ROWS` numbers).

## 2026-05-18 (Pre-launch — Signed-in dashboard + post-login home)

- **Post-login redirect** — Magic link callback ([`auth/callback`](src/app/auth/callback/route.ts)) defaults to [`/dashboard`](src/app/dashboard/page.tsx) ([`resolvePostLoginRedirectPath`](src/lib/claims/post-login-redirect.ts)). Legacy [`/protected`](src/app/protected/page.tsx) redirects there too.
- **Dashboard UX** — Wide two-column layout: **New check** embeds [`CheckFunnelClient`](src/components/check/check-funnel-client.tsx) (`variant="dashboard"`, up to 10 numbers, refreshes search list on submit) beside **Your searches** ([`ClaimsDashboard`](src/components/dashboard/claims-dashboard.tsx), [`DashboardClaimCard`](src/components/dashboard/dashboard-claim-card.tsx)). [`/check`](src/app/check/page.tsx) remains the anonymous-first funnel.
- **Logged-in header** — Funnel chrome shows **Dashboard** only (hidden on `/dashboard` where screening is inline). Removed redundant **Check numbers** nav link ([`consumer-funnel-nav.ts`](src/lib/layout/consumer-funnel-nav.ts)).

## 2026-05-18 (Pre-launch — One free anonymous lookup on `/check`)

### One free check before sign-in

- **Single number, single run** — Anonymous `/check` accepts **one** U.S. phone per session ([`CHECK_FREE_LOOKUP_MAX_PHONES`](src/lib/check/constants.ts) = 1). “Add number” / multi-row UI removed for anonymous funnel; heading is **Enter a number**.
- **Account wall after any completed check** — [`loadClaimGateStatusByClaimId`](src/lib/claims/load-claim-query-snapshot.ts) sets `requires_account_wall` when `claim_subjects.length > 0` (spam hit or no-hit). Second submit blocked with **403** in [`POST /api/check/submit`](src/app/api/check/submit/route.ts).
- **Copy** — Intro on [`/check`](src/app/check/page.tsx) via [`CHECK_FREE_LOOKUP_INTRO`](src/lib/check/constants.ts). Removed dashed-panel “No account is required yet…” from [`CheckOutcomePanel`](src/components/check-outcome-panel.tsx); panel now shows [`AccountWall`](src/components/account-wall.tsx) (or optional email capture) only after the free check.
- **Signed-in `/check`** — [`GET /api/claims/anonymous/status`](src/app/api/claims/anonymous/status/route.ts) returns `requires_account_wall: false` when a session exists (avoids wall copy for logged-in users).
- **Gated routes** — Dropped `/check?retry=1` redirect for no-hit retries in [`enforce-post-check-access.ts`](src/lib/claims/enforce-post-check-access.ts). Vitest: [`load-claim-query-snapshot.test.ts`](src/lib/claims/load-claim-query-snapshot.test.ts).

## 2026-05-18 (Pre-launch — Consumer funnel UX: `/check`, evidence, header)

### Consumer flow (intended path)

1. **`/check`** — Enter one U.S. number (free anonymous lookup), run spam screening, then sign in to continue.
2. **`/qualify/...`** — Factual questions (DNC, stop requests, company, line type, etc.).
3. **`/results?claim=…`** — Informational strength and valuation; optional attorney CTA.
4. **`/attorney-connect?claim=…`** — PRD §10 **Preserve your evidence** checklist, then consent, then referral + evidence PDF for firms.

### `/check` (screening first)

- **Removed Step 0** — PRD §10 evidence preservation no longer blocks number entry. `/check` is a single **Enter a number** step ([`CHECK_NUMBER_ENTRY_HEADING`](src/lib/check/constants.ts)); deleted [`CheckStepIndicator`](src/components/check/check-step-indicator.tsx) and the step-0 / step-1 wizard in [`CheckFunnelClient`](src/components/check/check-funnel-client.tsx).
- **No spam-database hit (§5.6):** Clearer per-number headline + body ([`no-spam-hit.ts`](src/lib/constants/no-spam-hit.ts)). After the free check, **Next step** → **Sign in to continue** when the account wall applies ([`check-funnel-continue.ts`](src/lib/check/check-funnel-continue.ts)). **Run check** hides after results and after the free lookup is used; [`CheckOutcomePanel`](src/components/check-outcome-panel.tsx) shows **AccountWall** (or email capture when eligible).
- **Hydration:** Phone row DOM ids use React [`useId()`](src/components/check/check-funnel-client.tsx) instead of `crypto.randomUUID()` (fixes SSR/client `htmlFor` mismatch).

### Evidence preservation (before attorney referral)

- **Moved to `/attorney-connect`** — Six checklist items ([`evidence-checklist-items.ts`](src/lib/check/evidence-checklist-items.ts)) render in [`EvidencePreservationChecklist`](src/components/evidence/evidence-preservation-checklist.tsx) on [`AttorneyConnectForm`](src/components/results/attorney-connect-form.tsx). User must check all items or acknowledge **continue anyway** ([`canProceedPastEvidenceChecklist`](src/lib/check/evidence-checklist-gate.ts)) before submit — aligns evidence gathering with building the profile shared via the §13.2 evidence PDF.

### Logged-in app header

- [`ConsumerFunnelHeader`](src/components/layout/consumer-funnel-header.tsx) + [`LoggedInAppHeader`](src/components/layout/logged-in-app-header.tsx) on [`check/layout.tsx`](src/app/check/layout.tsx), [`dashboard/layout.tsx`](src/app/dashboard/layout.tsx), and [`(post-check)/layout.tsx`](src/app/(post-check)/layout.tsx): brand, **Dashboard** (when not already on `/dashboard`), **Sign out**. Anonymous `/check` has no app header (marketing pages use [`MarketingHeader`](src/components/marketing/marketing-header.tsx)).

## 2026-05-18 (§7.2 — Qualify wizard step 1 reorder)

- **Step 1** is now an **orientation screen** only ([`screen-1-intro-form.tsx`](src/components/qualify/screen-1-intro-form.tsx), [`POST /api/qualify/screen-1-intro`](src/app/api/qualify/screen-1-intro/route.ts)) — no consent questions before the caller is named.
- **Removed Q2** (third-party / partner consent) from the consumer flow; persisted as `false` when consent is saved.
- **Consent / EBR (Q1 + Q3)** moved to **step 5**, after company identification — prompts use the company name ([`screen-5-consent-form.tsx`](src/components/qualify/screen-5-consent-form.tsx), [`format-company-consent-prompt.ts`](src/lib/qualify/format-company-consent-prompt.ts)).
- **Line type** is now **step 6** (wizard max step 6 in [`constants.ts`](src/lib/qualify/constants.ts)).

## 2026-05-18 (§6.2.4 — Federal DNC evidence PDF uploads)

- **Optional FTC confirmation upload** now accepts **PDF** in addition to JPEG/PNG/WebP/GIF — validation in [`federal-dnc-evidence.ts`](src/lib/dnc/federal-dnc-evidence.ts), copy in [`federal-dnc-attestation.ts`](src/lib/constants/federal-dnc-attestation.ts), file input `accept` on [`federal-dnc-attestation-form.tsx`](src/components/qualify/federal-dnc-attestation-form.tsx). Storage: migration [`20260518150000_federal_dnc_evidence_allow_pdf.sql`](supabase/migrations/20260518150000_federal_dnc_evidence_allow_pdf.sql) adds `application/pdf` to `claim-evidence` bucket `allowed_mime_types`. Vitest: [`federal-dnc-evidence.test.ts`](src/lib/dnc/federal-dnc-evidence.test.ts).

## 2026-05-18 (Pre-launch — Marketing header auth, PKCE UX, leads RLS fix)

- **Marketing header auth:** [`MarketingHeader`](src/components/marketing/marketing-header.tsx) renders [`MarketingHeaderAuth`](src/components/marketing/marketing-header-auth.tsx) inside `<Suspense>` on all public marketing pages — **Sign in** when logged out, **Sign out** when a session exists (no email label in the header). Shared client control: [`SignOutButton`](src/components/sign-out-button.tsx); [`LogoutButton`](src/components/logout-button.tsx) wraps it for starter-template compatibility (`redirectTo=/login`).
- **Magic-link PKCE UX:** [`/auth/error`](src/app/auth/error/page.tsx) detects “PKCE code verifier” failures and shows same-browser recovery steps + link to `/login`. [`MagicLinkLoginForm`](src/components/magic-link-login-form.tsx) warns users to open the link in the same browser tab after send.
- **Database (§13.4 pool RLS):** Migration [`20260518140000_fix_leads_pool_rls_recursion.sql`](supabase/migrations/20260518140000_fix_leads_pool_rls_recursion.sql) — `leads_select_firm_pool` uses denormalized `leads.consumer_state` instead of joining `public.users`, fixing Postgres `42P17` infinite recursion with `users_select_for_firm_assigned_lead` (blocked signed-in consumers on `/results` during pre-launch testing). Comment added to [`20260517210000_leads_firm_pool_rls.sql`](supabase/migrations/20260517210000_leads_firm_pool_rls.sql).

## 2026-05-17 (Docs — Pre-launch testing checklist)

- Added [`docs/pre-launch-testing-checklist.md`](docs/pre-launch-testing-checklist.md) — migrations, env tiers (A–E), consumer manual test path, firm portal notes, production gates. Linked from README.

## 2026-05-17 (Phase 3.7 — Marketing copy pivot, legacy `/letter` redirect)

- **§3.7.1–3.7.3:** Replaced DIY demand-letter copy with evidence → strength → attorney referral across landing ([`landing-content.ts`](src/lib/marketing/landing-content.ts), hero, features, CTA), [`faq.ts`](src/lib/marketing/faq.ts), [`account-wall.tsx`](src/components/account-wall.tsx), and [`/check`](src/app/check/page.tsx).
- **§3.7.4:** Updated [`privacy.ts`](src/lib/marketing/privacy.ts) (lead sharing with firms) and [`terms.ts`](src/lib/marketing/terms.ts) (attorney connection; removed letter purchase/refund sections).
- **Legacy routes:** [`/letter/*`](src/app/(post-check)/letter/[[...slug]]/page.tsx) redirects to `/results` (like `/summary`). Removed `/letter` from post-check gated routes ([`gated-routes.ts`](src/lib/claims/gated-routes.ts)). `public.letters` table retained in DB (unused in v0.1).

## 2026-05-17 (Post-MVP — Firm landing + CI fix)

- **Firm marketing:** Public [`/firms`](src/app/firms/page.tsx) landing for law firms and attorneys ([`firms-landing-content.ts`](src/lib/marketing/firms-landing-content.ts)) — value proposition, how referrals work, contact CTA. Header **Law firms** links here.
- **Portal sign-in closed:** [`/firms/login`](src/app/firms/login/page.tsx) redirects to `/firms`. Unauthenticated portal routes redirect to the landing ([`require-firm-user.ts`](src/lib/firms/require-firm-user.ts), [`apply-firm-portal-proxy.ts`](src/lib/firms/apply-firm-portal-proxy.ts)). Invited firms can still use `/firms/leads` when already authenticated.
- **CI:** [`claimEvent.test.ts`](src/lib/constants/claimEvent.test.ts) expects 8 `claim_event` types including `firm_lead_dispute` (§13.8).
- **Backlog:** Bot protection (Cloudflare Turnstile + WAF) tracked in [`docs/ongoing_task_manager.md`](docs/ongoing_task_manager.md).

## 2026-05-17 (Phase 13.8 — Firm contact disputes placeholder)

- **§13.8.1:** Consumers with an accepted firm assignment can report firm contact issues on [`/results`](src/app/(post-check)/results/page.tsx) via [`FirmContactDisputeForm`](src/components/results/firm-contact-dispute-form.tsx) → [`POST /api/leads/[leadId]/firm-contact-dispute`](src/app/api/leads/[leadId]/firm-contact-dispute/route.ts). Persists `claim_events` (`event_type=firm_lead_dispute`, `source=user_input`) via [`record-firm-contact-dispute.ts`](src/lib/leads/record-firm-contact-dispute.ts).
- **§13.8.2:** Ops notification email when `OPS_DISPUTE_EMAIL` + `RESEND_API_KEY` are set ([`send-firm-contact-dispute-ops-email.ts`](src/lib/leads/send-firm-contact-dispute-ops-email.ts)). Internal admin UI deferred.

## 2026-05-17 (Phase 13.7 — State DNC integrations scaffold)

- **§13.7.1:** Per-state spike checklist for eleven registry states ([`docs/spikes/20260517300000-state-dnc-integrations.md`](docs/spikes/20260517300000-state-dnc-integrations.md)) — telemarketer-scrub model; no public API confirmed.
- **§13.7.2:** Normalize provider results into `dnc_check_results` ([`normalize-state-dnc-lookup.ts`](src/lib/dnc/normalize-state-dnc-lookup.ts), [`persist-state-dnc-lookup.ts`](src/lib/dnc/persist-state-dnc-lookup.ts)); triggered after federal attestation when applicable ([`run-state-dnc-lookup.ts`](src/lib/dnc/run-state-dnc-lookup.ts)).
- **§13.7.3:** Per-state feature flags `STATE_DNC_{CODE}_ENABLED` ([`state-dnc-flags.ts`](src/lib/dnc/state-dnc-flags.ts), `.env.example`). Default off; +10 scoring unchanged until lookup persists `state_dnc_registered: true`.

## 2026-05-17 (Phase 13.6 — Firm status updates → user visibility)

- **§13.6.1:** Firm inbox actions to mark leads `contacted`, `retained`, or `closed` with timestamps ([`update-firm-lead-status.ts`](src/lib/firms/update-firm-lead-status.ts), [`PATCH /api/firms/leads/[leadId]/status`](src/app/api/firms/leads/[leadId]/status/route.ts), [`firm-lead-status-actions.tsx`](src/components/firms/firm-lead-status-actions.tsx)). Migration adds `retained_at` + RLS `leads_update_firm_assigned_status` ([`20260517230000_firm_lead_status_updates.sql`](supabase/migrations/20260517230000_firm_lead_status_updates.sql)).
- **§13.6.2:** Consumers see referral status on `/results` ([`AttorneyLeadStatusPanel`](src/components/results/attorney-lead-status-panel.tsx), [`load-consumer-lead-status.ts`](src/lib/leads/load-consumer-lead-status.ts)); existing `leads_select_consumer_own` policy covers status fields.
- **§13.6.3:** Stale `accepted` reminder cron ([`send-firm-lead-status-reminders.ts`](src/lib/firms/send-firm-lead-status-reminders.ts), [`POST /api/cron/firm-lead-status-reminder`](src/app/api/cron/firm-lead-status-reminder/route.ts)); set `CRON_SECRET` and schedule daily.

## 2026-05-17 (Phase 13.5 — Lead accept and payment)

- **§13.5.1:** Accept button → Stripe Checkout on firm Connect account ([`create-lead-accept-checkout-session.ts`](src/lib/stripe/connect/create-lead-accept-checkout-session.ts)); direct charge with `application_fee_amount` (platform lead fee). APIs: [`POST /api/firms/leads/[leadId]/accept`](src/app/api/firms/leads/[leadId]/accept/route.ts), [`release-payment`](src/app/api/firms/leads/[leadId]/release-payment/route.ts) on cancel.
- **§13.5.2:** Webhook `payment_intent.succeeded` / failed → [`finalize-lead-accept-payment.ts`](src/lib/firms/finalize-lead-accept-payment.ts) / [`release-lead-payment-lock.ts`](src/lib/firms/release-lead-payment-lock.ts). RLS unlocks consumer email/name and claim subjects for assigned accepted leads ([`20260517220000_firm_lead_accept_decline.sql`](supabase/migrations/20260517220000_firm_lead_accept_decline.sql)).
- **§13.5.3:** Decline with optional reason → `firm_lead_declines`; pool RLS excludes declined rows per firm ([`decline-firm-lead.ts`](src/lib/firms/decline-firm-lead.ts)).
- Firm inbox UI: Accept / Decline actions, contact column after paid accept ([`firm-lead-row-actions.tsx`](src/components/firms/firm-lead-row-actions.tsx), [`firm-leads-table.tsx`](src/components/firms/firm-leads-table.tsx)).

## 2026-05-17 (Phase 13.4 — Firm dashboard app)

- **§13.4.1:** Firm portal routes under `/firms/*` in the same Next.js app; optional `firms.*` hostname rewrite via [`apply-firm-portal-proxy.ts`](src/lib/firms/apply-firm-portal-proxy.ts) + [`firm-portal-host.ts`](src/lib/firms/firm-portal-host.ts).
- **§13.4.2:** Firm auth — [`/firms/login`](src/app/firms/login/page.tsx), [`linkFirmUserOnLogin`](src/lib/firms/link-firm-user-on-login.ts) on [`/auth/callback`](src/app/auth/callback/route.ts), ops invite [`POST /api/firms/invite`](src/app/api/firms/invite/route.ts) (`FIRM_OPS_INVITE_SECRET`).
- **§13.4.3:** Lead inbox at [`/firms/leads`](src/app/firms/(portal)/leads/page.tsx) with state / min value / strength filters ([`apply-firm-lead-filters.ts`](src/lib/firms/apply-firm-lead-filters.ts)).
- **§13.4.4:** **Pool model** RLS [`leads_select_firm_pool`](supabase/migrations/20260517210000_leads_firm_pool_rls.sql) (unassigned `new`/`reviewed` rows matching firm criteria) + Realtime INSERT subscription ([`FirmLeadsRealtime`](src/components/firms/firm-leads-realtime.tsx)); `leads` added to `supabase_realtime` publication.
- Stripe return UI: [`/firms/onboarding/stripe/complete`](src/app/firms/(portal)/onboarding/stripe/complete/page.tsx), [`/refresh`](src/app/firms/(portal)/onboarding/stripe/refresh/page.tsx).

## 2026-05-17 (Phase 13.3 — Stripe Connect onboarding)

- **§13.3.1:** **Express** Connect accounts for law firms ([`stripe/connect/constants.ts`](src/lib/stripe/connect/constants.ts)) — platform-hosted onboarding; supports application fees on lead accept (§13.5).
- **§13.3.2:** [`POST /api/firms/stripe-connect/onboarding`](src/app/api/firms/stripe-connect/onboarding/route.ts) — authenticated `firm_users` row → creates Connect account if needed → Stripe Account Link URL. Requires `STRIPE_SECRET_KEY` + `SUPABASE_SECRET_KEY`.
- **§13.3.3:** `law_firms.stripe_connect_account_id`, `stripe_connect_charges_enabled`, `stripe_connect_details_submitted` (migration [`20260517190000_law_firms_stripe_connect.sql`](supabase/migrations/20260517190000_law_firms_stripe_connect.sql)); [`POST /api/webhooks/stripe`](src/app/api/webhooks/stripe/route.ts) handles `account.updated` via [`syncConnectAccountFromStripe`](src/lib/stripe/connect/sync-connect-account-from-stripe.ts).
- Dependency: `stripe`. Vitest: `sync-connect-account-from-stripe.test.ts`, `resolve-site-origin.test.ts`.

## 2026-05-17 (Phase 13.2 — Evidence PDF for firms)

- **§13.2:** Evidence PDF compiler ([`generate-and-upload-evidence-pdf.ts`](src/lib/leads/evidence-pdf/generate-and-upload-evidence-pdf.ts)) — aggregates claim/subject data, qualification answers, spam/DNC summaries, registered agent, upload paths; renders via **pdfkit**; uploads to private `lead-packages` Storage bucket; sets `leads.evidence_pdf_url` (`bucket:path` ref). Triggered from [`run-evidence-pdf-job.ts`](src/lib/leads/run-evidence-pdf-job.ts) after attorney referral submit. Migration: [`20260517143000_lead_packages_storage.sql`](supabase/migrations/20260517143000_lead_packages_storage.sql).
- **§13.2.4:** [`AttorneySharingChecklist`](src/components/results/attorney-sharing-checklist.tsx) on `/results` — transparency list of what may be shared with attorneys ([`attorney-sharing-checklist.ts`](src/lib/constants/attorney-sharing-checklist.ts)).
- Vitest: `build-evidence-pdf-buffer.test.ts`, `format-qualification-lines.test.ts`, `constants.test.ts`.

## 2026-05-17 (Phase 13.1 — Consumer attorney path)

- **§13.1:** [`/attorney-connect`](src/app/(post-check)/attorney-connect/page.tsx) — 48h contact expectation, informational contingency copy, lead-sharing consent ([`attorney-referral-expectations.ts`](src/lib/constants/attorney-referral-expectations.ts)). [`AttorneyReferralCta`](src/components/results/attorney-referral-cta.tsx) links eligible users from `/results`. [`POST /api/leads/attorney-referral`](src/app/api/leads/attorney-referral/route.ts) enforces [`canReferToAttorney`](src/lib/claims/can-refer-to-attorney.ts), inserts `leads` (`status=new`) with valuation snapshot, records eligible subject ids on `claim_events`, queues evidence PDF job stub ([`enqueue-evidence-pdf-job.ts`](src/lib/leads/enqueue-evidence-pdf-job.ts) → §13.2). Confirmation email via Resend when `RESEND_API_KEY` is set ([`send-attorney-referral-confirmation.ts`](src/lib/leads/send-attorney-referral-confirmation.ts)). Vitest: `create-attorney-lead.test.ts`.

## 2026-05-17 (Phase 11 — SEO landings, URL strategy, technical SEO)

- **§11.1:** Canonical company URL `/{slug}-spam-calls` documented in [`docs/seo.md`](docs/seo.md). Legacy `/:company-*-spam-calls-compensation` and `/tcpa-demand-letter` → checker (`next.config.ts` redirects). Dynamic template [`src/app/[slug]/page.tsx`](src/app/[slug]/page.tsx) with `generateMetadata` ([`company-pages.ts`](src/lib/seo/company-pages.ts) registry empty until §11.3).
- **§11.2:** SEO landing pages — [`/tcpa-violation-checker`](src/app/tcpa-violation-checker/page.tsx), [`/spam-call-compensation`](src/app/spam-call-compensation/page.tsx), [`/do-not-call-registry-violation`](src/app/do-not-call-registry-violation/page.tsx), [`/robocall-lawsuit`](src/app/robocall-lawsuit/page.tsx) ([`seo-landing-pages.ts`](src/lib/marketing/seo-landing-pages.ts), [`SeoLandingPage`](src/components/marketing/seo-landing-page.tsx)); FAQ JSON-LD on checker; footer **Resources** cluster.
- **§11.4:** [`sitemap.ts`](src/app/sitemap.ts), [`robots.ts`](src/app/robots.ts) (block `VERCEL_ENV=preview`), [`canonical-metadata.ts`](src/lib/seo/canonical-metadata.ts), `NEXT_PUBLIC_SITE_URL` in [`.env.example`](.env.example). Vitest: `company-pages.test.ts`, `site-url.test.ts`, `public-routes.test.ts`.

## 2026-05-17 (Phase 8.5 — Persist scoring outputs)

- **§8.5:** After qualify completion, [`persistClaimScoring`](src/lib/scoring/persist-claim-scoring.ts) writes `claims.claim_strength` and `estimated_value_*_cents` (conservative low/high + realistic from [`computeValuation`](src/lib/scoring/compute-valuation.ts)); appends `value_calculated` audit rows ([`scoring-claim-events.ts`](src/lib/scoring/scoring-claim-events.ts): strength, violation counts, maximum cents, per-subject matrix JSON) and `scoring_status=complete`. Wired on [`POST /api/qualify/screen-5`](src/app/api/qualify/screen-5/route.ts); backfill on `/results` when strength was null. Shared compute: [`computeClaimScoring`](src/lib/scoring/compute-claim-scoring.ts). Vitest: `compute-claim-scoring.test.ts`, `persist-claim-scoring.test.ts`.

## 2026-05-17 (Phase 8.4 — Results UI)

- **§8.4:** [`/results`](src/app/(post-check)/results/page.tsx) — per-subject cards ([`ResultsSubjectCard`](src/components/results/results-subject-card.tsx): spam/DNC summaries, exempt + strength badges), claim-level strength header ([`ResultsStrengthHeader`](src/components/results/results-strength-header.tsx)), three-scenario valuation ([`ResultsValuationPanel`](src/components/results/results-valuation-panel.tsx)), ineligible panel + email capture ([`ResultsIneligiblePanel`](src/components/results/results-ineligible-panel.tsx)), attorney CTA with weak-strength acknowledgement ([`AttorneyReferralCta`](src/components/results/attorney-referral-cta.tsx)). Scoring via [`loadResultsPageContext`](src/lib/claims/load-results-page-context.ts) + [`computeClaimScoring`](src/lib/scoring/compute-claim-scoring.ts) (persisted §8.5). Vitest: `aggregate-claim-strength.test.ts`, `subject-evidence-summaries.test.ts`.

## 2026-05-17 (Phase 8.3 — Valuation engine)

- **§8.3:** PRD §11 three-scenario valuation — [`computeViolationCounts`](src/lib/scoring/compute-violation-counts.ts) (`standard` / `willful` / `time` from Q8–Q12 + Screen 2 stop), [`computeValuation`](src/lib/scoring/compute-valuation.ts) (conservative low/high, realistic, maximum in integer cents; `formatUsdFromCents`). SOL addendum via [`buildValuationDisplayCaveat`](src/lib/scoring/compute-valuation.ts) when `likelyTimeBarred`. Vitest: [`compute-valuation.test.ts`](src/lib/scoring/compute-valuation.test.ts). Persist + `/results` UI → §8.4–8.5.

## 2026-05-17 (Phase 8.2 — Statute of limitations)

- **§8.2:** SOL engine — [`getStateSolYears`](src/lib/scoring/state-sol-years.ts) (informational per-state overrides + 4-year default), [`computeSolFlags`](src/lib/scoring/compute-sol-flags.ts) from Q10 `most_recent_call_date` + `users.state`, `likely_time_barred` when both federal and state windows are expired (PRD §7 Step 5). Persisted on Screen 3 save via [`persistSolFlags`](src/lib/scoring/persist-sol-flags.ts) → `claim_events` `value_calculated` keys. [`/results`](src/app/(post-check)/results/page.tsx) shows informational [`SolWarningBanner`](src/components/results/sol-warning-banner.tsx) — no hard block. Vitest: `compute-sol-flags.test.ts`, `state-sol-years.test.ts`, `persist-sol-flags.test.ts`.

## 2026-05-17 (Phase 8.1 — Claim strength matrix)

- **§8.1:** PRD §8 scoring engine — [`strength-matrix-constants.ts`](src/lib/scoring/strength-matrix-constants.ts) (point values + thresholds), [`computeStrengthMatrix`](src/lib/scoring/strength-matrix.ts) + `StrengthMatrixInput` (aggregates spam/DNC/stop/time-of-day/company/RA/SOL/consent/exempt), exempt → `ineligible` override, `mapScoreToClaimStrength` (≥70 strong, ≥40 moderate, ≥10 weak). Reuses per-signal resolvers from §5.6 / §6.1 / §6.3. Vitest: [`strength-matrix.test.ts`](src/lib/scoring/strength-matrix.test.ts). Persistence + `/results` UI → §8.4–8.5.

## 2026-05-17 (Phase 7.7 — Qualify completion → results)

- **§7.7:** Final Screen 5 submit ([`POST /api/qualify/screen-5`](src/app/api/qualify/screen-5/route.ts)) sets `claims.status` → `qualified` and records `qualification_completed` + `scoring_status=pending` on `claim_events` ([`complete-qualify-claim.ts`](src/lib/qualify/complete-qualify-claim.ts)) for Phase 8 scoring. Redirect to [`/results?claim=`](src/app/(post-check)/results/page.tsx) with attorney referral CTA when [`canReferToAttorney`](src/lib/claims/can-refer-to-attorney.ts) passes ([`AttorneyReferralCta`](src/components/results/attorney-referral-cta.tsx)). [`/summary`](src/app/(post-check)/summary/page.tsx) redirects to `/results` (letter cart dropped for v0.1).

## 2026-05-17 (Phase 7.6 — Screen 5 line type attestation)

- **§7.6:** Step 5 on [`/qualify/[claimSubjectId]?step=5`](src/app/(post-check)/qualify/[claimSubjectId]/page.tsx) — user attests mobile vs home/landline ([`Screen5LineTypeForm`](src/components/qualify/screen-5-line-type-form.tsx), [`POST /api/qualify/screen-5`](src/app/api/qualify/screen-5/route.ts)) → `claim_events` key `line_type` (`mobile` \| `residential`). TCPA subsection mapping for scoring/evidence: [`line-type-statute.ts`](src/lib/tcpa/line-type-statute.ts) (§227(b)(1)(A)(iii) vs (B)). Screen 4 now continues to step 5 instead of `/results`.

## 2026-05-17 (Phase 7.5 — Screen 4 company identification)

- **§7.5:** Step 4 on [`/qualify/[claimSubjectId]?step=4`](src/app/(post-check)/qualify/[claimSubjectId]/page.tsx) — voicemail upload + OpenRouter STT/extract ([`POST /api/qualify/voicemail`](src/app/api/qualify/voicemail/route.ts), [`openrouter-voicemail.ts`](src/lib/company/openrouter-voicemail.ts)), Q13 company + context, Q14 `has_additional_evidence` ([`Screen4CompanyForm`](src/components/qualify/screen-4-company-form.tsx), [`POST /api/qualify/screen-4`](src/app/api/qualify/screen-4/route.ts)). Voicemail path sets `company_identified` via [`persistVoicemailCompanyIdentification`](src/lib/company/persist-voicemail-company-identification.ts); manual Q13 via [`persistUserCompanyIdentification`](src/lib/company/persist-user-company-identification.ts) + OpenCorporates soft verify. Env: `OPENROUTER_API_KEY`, `OPENCORPORATES_API_TOKEN`.

## 2026-05-17 (Phase 7.4 — Screen 3 call details)

- **§7.4:** Step 3 on [`/qualify/[claimSubjectId]?step=3`](src/app/(post-check)/qualify/[claimSubjectId]/page.tsx) — Q8 call-count buckets, conditional Q9 post-stop count, Q10 most recent call date, Q11–Q12 time-of-day ([`Screen3CallDetailsForm`](src/components/qualify/screen-3-call-details-form.tsx), copy [`qualify-screen-3.ts`](src/lib/constants/qualify-screen-3.ts)). [`POST /api/qualify/screen-3`](src/app/api/qualify/screen-3/route.ts) persists `call_count_total`, `call_count_after_stop`, `most_recent_call_date`, `calls_before_8am`, `calls_after_9pm`, `calls_after_9pm_count` ([`screen-3-call-details.ts`](src/lib/qualify/screen-3-call-details.ts)) and calls [`recomputeFederalDncEligibility`](src/lib/dnc/recompute-federal-dnc-eligibility.ts) using `most_recent_call_date` as earliest-call proxy for the 31-day rule.

## 2026-05-17 (Phase 7.3 — Screen 2 stop request / willful)

- **§7.3:** Step 2 on [`/qualify/[claimSubjectId]?step=2`](src/app/(post-check)/qualify/[claimSubjectId]/page.tsx) — Q4 branches to Q5–Q7 when user asked company to stop ([`Screen2StopRequestForm`](src/components/qualify/screen-2-stop-request-form.tsx), copy [`qualify-screen-2.ts`](src/lib/constants/qualify-screen-2.ts)). [`POST /api/qualify/screen-2`](src/app/api/qualify/screen-2/route.ts) persists `qualification_answer` keys `stop_request_made`, `stop_request_method`, `stop_request_date`, `calls_after_stop_request` and updates `dnc_check_results.internal_dnc_*` ([`screen-2-stop-request.ts`](src/lib/qualify/screen-2-stop-request.ts)).

## 2026-05-17 (Phase 7.2 — Screen 1 consent / EBR)

- **§7.2:** Step 1 on [`/qualify/[claimSubjectId]?step=1`](src/app/(post-check)/qualify/[claimSubjectId]/page.tsx) — Q1–Q3 yes/no ([`Screen1ConsentForm`](src/components/qualify/screen-1-consent-form.tsx), copy [`qualify-screen-1.ts`](src/lib/constants/qualify-screen-1.ts)). [`POST /api/qualify/screen-1`](src/app/api/qualify/screen-1/route.ts) persists `qualification_answer` keys `gave_direct_consent`, `third_party_consent_possible`, `has_existing_relationship` ([`screen-1-consent.ts`](src/lib/qualify/screen-1-consent.ts)). When Q1 or Q3 is Yes, EBR explainer modal + `ebr_strength_adjustment_*` claim events for scoring / attorney evidence summary.

## 2026-05-17 (Phase 7.1 — qualify routing and step state)

- **§7.1:** [`/qualify/[claimSubjectId]`](src/app/(post-check)/qualify/[claimSubjectId]/page.tsx) loads subject + owned claim ([`load-qualify-context.ts`](src/lib/qualify/load-qualify-context.ts)); 404 on invalid UUID, wrong `?claim=`, or non-owner. Federal DNC pre-gate, then wizard screens **1–4** via `?step=`; auto-redirect to `?step=1` after attestation. Resume from `claim_events` key `qualify_step_resume` ([`qualify-step.ts`](src/lib/qualify/qualify-step.ts)). Placeholder chrome: [`qualify-wizard-shell.tsx`](src/components/qualify/qualify-wizard-shell.tsx) until §7.2–7.5 forms ship.

## 2026-05-17 (Product pivot + Phase 6.6 — attorney referral gate)

- **Product:** v0.1 focuses on **evidence gathering**, **informational claim strength**, and **attorney referral** — DIY demand letter generation and consumer Stripe letter Checkout are **out of scope** (Phases 9–10 cancelled in `task_manager.md`).
- **§6.6:** [`canReferToAttorney`](src/lib/claims/can-refer-to-attorney.ts) central gate with reason codes ([`attorney-referral.ts`](src/lib/constants/attorney-referral.ts)); [`assertCanReferToAttorney`](src/lib/claims/can-refer-to-attorney.ts) for server enforcement before `leads` insert (§13.1). Deprecated `canPurchaseLetter` alias.
- **Copy:** Attorney-referral framing in [`company-identification.ts`](src/lib/constants/company-identification.ts), [`fdcpa-debt-collection.ts`](src/lib/constants/fdcpa-debt-collection.ts), [`registered-agent-lookup.ts`](src/lib/constants/registered-agent-lookup.ts). Marketing pages still TODO (§3.7).

## 2026-05-16 (Phase 6.5 — registered agent lookup)

- **§6.5 OpenCorporates RA lookup:** Shared client [`opencorporates-api.ts`](src/lib/company/opencorporates-api.ts); [`lookupRegisteredAgentViaOpenCorporates`](src/lib/company/lookup-registered-agent-opencorporates.ts) searches by `company_name` + `users.state` (`jurisdiction_code=us_XX`), then national fallbacks (`us_de`, `us_nv`, `us_wy`, then `country_code=us`). Company detail → registered-agent officer → optional officer detail for address.
- **§6.5.3 persist:** [`persistRegisteredAgentLookup`](src/lib/company/persist-registered-agent-lookup.ts) writes `claim_subjects.registered_agent_*` + `claim_events` (`registered_agent_lookup`). Wired from [`persist-spam-check-outcome.ts`](src/lib/spam/persist-spam-check-outcome.ts) when `company_identified` + `userStateCode`, and [`persist-user-company-identification.ts`](src/lib/company/persist-user-company-identification.ts) after Q13.
- **§6.5.4–6.5.5 UX:** `/check` shows registered agent, manual SOS link ([`registered-agent-lookup.ts`](src/lib/constants/registered-agent-lookup.ts)), or rate-limit copy. Per-session budget via `consume_rate_limit` action `opencorporates_lookup` (6/hour). Env: `OPENCORPORATES_API_TOKEN`.

## 2026-05-16 (Phase 7.5 — Q13 soft verify + voicemail plan)

- **§7.5.1b OpenCorporates soft validation (scaffold):** After Q13 `user_input`, [`softVerifyCompanyNameWithOpenCorporates`](src/lib/company/opencorporates-soft-verify.ts) sets `claim_events.company_name_verification_status` to `user_input_verified` or `user_input_unverified`. Letter generation **allowed either way**; UI shows [`COMPANY_NAME_UNVERIFIED_WARNING`](src/lib/constants/company-name-verification.ts) when unverified. [`persist-user-company-identification.ts`](src/lib/company/persist-user-company-identification.ts) — wire on Q13 route (§7.5.1). Env: `OPENCORPORATES_API_TOKEN`.
- **§7.5.3–7.5.4 Voicemail (priority):** Spike [`docs/spikes/20260516230000-voicemail-company-identification.md`](docs/spikes/20260516230000-voicemail-company-identification.md) — upload audio on qualify → OpenRouter Whisper → extract company; `source: voicemail_transcription`, `company_identified = true` when name extracted. Moved up from v1; v0.1 web file upload.
- **Strategy:** [`docs/company-identification-strategy.md`](docs/company-identification-strategy.md) — voicemail before Q13 in pipeline; `claim_events.source` adds `voicemail_transcription`.

## 2026-05-16 (Phase 6.4 — company ID policy lock)

- **Strategy:** [`docs/company-identification-strategy.md`](docs/company-identification-strategy.md) — v0.1 trust rules after spoofing/CNAM review.
- **Code:** Only **Nomorobo** sets `company_identified` + `company_name`. Twilio CNAM and Whitepages → `company_name_hint` / metadata (not letter-grade). `/check` shows unverified caller-ID hint when present.
- **Deferred:** YouMail bake-off, FTC bulk index, TrueCaller, voicemail extraction — tracked in `task_manager.md` §6.4.5–6.4.7 and §7.5.3.

## 2026-05-16 (Phase 6.4 — company identification)

- **§6.4.1 provider merge:** [`merge-spam-results.ts`](src/lib/spam/merge-spam-results.ts) adds `companyNameSource` (`nomorobo` \| `twilio` \| `whitepages`). [`persist-spam-check-outcome.ts`](src/lib/spam/persist-spam-check-outcome.ts) writes `company_identified` + `company_name_source` on `claim_events` and subject columns (already set from §5.4).
- **§6.4.2 Whitepages Pro:** [`whitepages-company-lookup.ts`](src/lib/company/whitepages-company-lookup.ts) — reverse phone [`GET /v2/person`](https://api.whitepages.com/docs/documentation/person-search/reverse-phone-lookup) after spam merge when `WHITEPAGES_COMPANY_LOOKUP_ENABLED` + `WHITEPAGES_API_KEY`. Orchestration: [`enrich-merged-company-from-lookup.ts`](src/lib/company/enrich-merged-company-from-lookup.ts). Spike: [`docs/spikes/20260516220000-whitepages-company-lookup.md`](docs/spikes/20260516220000-whitepages-company-lookup.md). `claim_events.source` includes `whitepages`.
- **§6.4.2 FTC spike:** [`docs/spikes/20260516210000-ftc-complaints-company-lookup.md`](docs/spikes/20260516210000-ftc-complaints-company-lookup.md) — dnc-complaints API cannot query by caller number; stub [`ftc-complaints-company-lookup.ts`](src/lib/company/ftc-complaints-company-lookup.ts) (default off).
- **§6.4.3 letter block:** When company still unknown and not exempt, `claim_events.tcpa_letter_blocked = company_unidentified` ([`company-identification.ts`](src/lib/constants/company-identification.ts)).
- **§6.4.4 `/check` UX:** Unidentified-company copy + optional “Company identified: …” when merge succeeds; submit `number_checks` includes `company_identified` / `company_name`.

## 2026-05-16 (Phase 6.3 — state DNC scaffold)

- **§6.3.1 constants:** [`state-dnc-registries.ts`](src/lib/constants/state-dnc-registries.ts) — eleven PRD §7 Step 4 states (IN, TX, WY, CO, LA, MS, MO, OK, OR, PA, TN).
- **§6.3.2 v0.1 without APIs:** [`deriveStateDncScaffoldFields`](src/lib/dnc/scaffold-state-dnc-row.ts) sets `state_dnc_applicable` + `state_dnc_state` on federal attestation persist; `state_dnc_registered` / `state_dnc_checked_at` stay null. [`StateDncComingSoon`](src/components/qualify/state-dnc-coming-soon.tsx) on qualify when applicable. `/check` submit includes `state_dnc` summary (generic copy until profile state known).
- **§6.3.3 provider:** [`StateDncProvider`](src/lib/dnc/state-dnc-provider.ts) + `UnavailableStateDncProvider` (no fabricated +10; [`state-dnc-matrix-signal.ts`](src/lib/scoring/state-dnc-matrix-signal.ts)).

## 2026-05-16 (Phase 6.2 — federal DNC attestation wired)

- **§6.2.1 qualify gate:** [`FederalDncAttestationForm`](src/components/qualify/federal-dnc-attestation-form.tsx) on [`/qualify/[claimSubjectId]`](src/app/(post-check)/qualify/[claimSubjectId]/page.tsx) — yes/no + registration date, donotcall.gov self-check copy, gate validation ([`federal-dnc-attestation-gate.ts`](src/lib/dnc/federal-dnc-attestation-gate.ts)). [`POST /api/qualify/federal-dnc`](src/app/api/qualify/federal-dnc/route.ts) persists to `dnc_check_results` + `claim_events` (`source: user_input`).
- **§6.2.2 eligibility:** [`persist-federal-dnc-attestation.ts`](src/lib/dnc/persist-federal-dnc-attestation.ts) computes `federal_dnc_eligible` when `earliest_call_date` is provided; otherwise null until Phase 7 call-date step. [`recompute-federal-dnc-eligibility.ts`](src/lib/dnc/recompute-federal-dnc-eligibility.ts) for recomputation. Matrix +25 via [`resolveFederalDncMatrixSignal`](src/lib/scoring/federal-dnc-matrix-signal.ts) with `attestedByUser`.
- **§6.2.4 optional screenshot:** Private `claim-evidence` Storage bucket ([`20260516193000_federal_dnc_evidence_storage.sql`](supabase/migrations/20260516193000_federal_dnc_evidence_storage.sql)); optional upload on qualify form → path on `claim_subjects.metadata` + `claim_events` (`federal_dnc_confirmation_screenshot_path`). Not required to proceed; not legal verification.
- **§6.2.0 / §6.2.3:** Registry API/vendor scrub remains **blocked** pending counsel ([spike doc](docs/spikes/20260516190000-federal-dnc-access.md)).

## 2026-05-16 (Phase 6.1 — federal DNC spike + scoring guard)

- **§6.1 spike:** [`docs/spikes/20260516190000-federal-dnc-access.md`](docs/spikes/20260516190000-federal-dnc-access.md) — FTC [`dnc-complaints`](https://www.ftc.gov/developer/api/v0/endpoints/do-not-call-dnc-reported-calls-data-api) is complaint data, not registry lookup; National Registry API/vendor scrub **not** used for claim scoring ([FTC Q&A #13](https://www.ftc.gov/business-guidance/resources/qa-telemarketers-sellers-about-dnc-provisions-tsr-0)).
- **§6.1.3 `/check`:** [`FEDERAL_DNC_UNAVAILABLE_USER_MESSAGE`](src/lib/constants/federal-dnc-unavailable.ts); `POST /api/check/submit` returns `federal_dnc` summary. No fabricated registry positives in scoring.

## 2026-05-16 (Phase 5.7 — FDCPA / debt collection)

- **§5.7.1 UX + block:** Debt-collection category shows [`FDCPA_DEBT_COLLECTION_USER_MESSAGE`](src/lib/constants/fdcpa-debt-collection.ts) on `/check` (`number_checks[].is_debt_collection`). TCPA letter path blocked via `claim_events` key `tcpa_letter_blocked` = `fdcpa_debt_collection` and [`isTcpaLetterBlockedForCallCategory`](src/lib/constants/fdcpa-debt-collection.ts) for Phase 6.
- **§5.7.2 email:** All-exempt debt-collection claims trigger waitlist source `debt_collection_interest` ([`email-capture-trigger.ts`](src/lib/claims/email-capture-trigger.ts)); modal copy avoids product promises. Migration [`20260516183000_waitlist_debt_collection_interest.sql`](supabase/migrations/20260516183000_waitlist_debt_collection_interest.sql). Vitest: fdcpa-debt-collection, email-capture-trigger, persist, pipeline.
- **Assumptions (carry forward):** Debt collection resolves via §5.5 category aliases only; TCPA letter blocking is on `claim_events` now — Phase 6.6 `canPurchaseLetter` should call `isTcpaLetterBlockedForCallCategory()`; `debt_collection_interest` email capture only when all subjects are debt-collection exempt (mixed exempt → `exempt_only`).

## 2026-05-16 (Phase 5.6 — non-exempt no spam hit)

- **§5.6 UX:** Non-exempt numbers with no spam-database hit show [`NO_SPAM_HIT_USER_MESSAGE`](src/lib/constants/no-spam-hit.ts) on `/check` (soft warning; qualification still allowed). Submit JSON adds `number_checks[].is_known_spammer`.
- **§5.6 scoring inputs:** [`spam-db-matrix-signal.ts`](src/lib/scoring/spam-db-matrix-signal.ts) maps merged spam to PRD §8 tiers (`high` +30, `low` +15, `none` +0). Persisted on `claim_events` (`spam_db_matrix_tier`, `spam_db_matrix_points`). Vitest: spam-db-matrix-signal, persist, pipeline.

## 2026-05-16 (Phase 5.5 — exempt call categories)

- **§5.5 exempt handling:** [`exempt-categories.ts`](src/lib/constants/exempt-categories.ts) defines `EXEMPT_CATEGORIES` (PRD §6: political, charity, survey, healthcare, debt collection, emergency; EBR excluded). After spam merge, exempt rows set `claim_subjects.is_exempt` + `exempt_reason`; `number_checks` includes `is_exempt` / `call_category`. [`CheckFunnelClient`](src/components/check/check-funnel-client.tsx) shows PRD neutral TCPA-exempt copy per number. Vitest: exempt-categories, merge, persist, pipeline.

## 2026-05-16 (Phase 5.4 — spam orchestrator + persistence)

- **§5.4 orchestrator:** [`run-spam-checks.ts`](src/lib/spam/run-spam-checks.ts) runs Nomorobo + Twilio in `Promise.allSettled` (no HTTP when flags/keys off). [`merge-spam-results.ts`](src/lib/spam/merge-spam-results.ts) applies PRD §7 merge (OR `isSpam`, max score, sum complaints, Nomorobo-first category/company, `spam_db_source`).
- **§5.4 persistence:** [`persist-spam-check-outcome.ts`](src/lib/spam/persist-spam-check-outcome.ts) writes `claim_subjects` spam columns + `claim_events` (`spam_db_match` keys + per-provider `provider_raw`). [`spam-check-pipeline.ts`](src/lib/spam/spam-check-pipeline.ts) wired into [`POST /api/check/submit`](src/app/api/check/submit/route.ts). Vitest: merge, run, persist, pipeline tests.

## 2026-05-16 (Phase 5.3 — Nomorobo primary + provider stack)

- **Architecture:** v0.1 spam Step 1 is **Nomorobo Enterprise (primary)** + **Twilio Lookup v2 (secondary)** per [PRD §7](prd.md). YouMail removed from scope. Merge: OR `is_spam`, max score, sum complaints; category prefers Nomorobo.
- **§5.3 Nomorobo:** [`nomorobo-spam-provider.ts`](src/lib/spam/nomorobo-spam-provider.ts) — `GET /v2/check`, `X-API-Key`, maps `risk_score`, `number_of_calls`, `reported_category`, `reported_name` → [`SpamCheckResult`](src/lib/spam/types.ts). Vitest: [`nomorobo-spam-provider.test.ts`](src/lib/spam/nomorobo-spam-provider.test.ts).
- **Flags / stubs:** `SPAM_PROVIDER_NOMOROBO_ENABLED` replaces `SPAM_PROVIDER_YOUMAIL_ENABLED`; pipeline stubs `nomorobo_stub` + `twilio_stub`. [`claimEvent.ts`](src/lib/constants/claimEvent.ts) source `nomorobo`. `.env.example`: `NOMOROBO_API_KEY`.

## 2026-05-16 (Phase 5.2 — Twilio Lookup v2 migration)

- **§5.2 refactor:** [`twilio-lookup-spam-provider.ts`](src/lib/spam/twilio-lookup-spam-provider.ts) now calls **Lookup v2** (`GET …/v2/PhoneNumbers/{E.164}?Fields=phone_number_quality_score,caller_name,line_type_intelligence`). Maps `phone_number_quality_score` → `score` / `isSpam` (threshold [`TWILIO_QUALITY_SPAM_THRESHOLD`](src/lib/spam/twilio-lookup-spam-provider.ts) = 80), CNAM → `companyName`, line type → `category`. Vitest updated. Replaces v1 `nomorobo_spamscore` add-on path.

## 2026-05-16 (Spam providers — architecture note)

- Superseded by **Nomorobo primary + Twilio secondary** entry above (YouMail no longer planned).

## 2026-05-15 (Phase 5.2 — Twilio Lookup spam adapter)

- **§5.2 Twilio REST (superseded):** Initial adapter used Lookup **v1** add-on; migrated to v2 on 2026-05-16 (see entry above).

## 2026-05-15 (Phase 5 — Twilio-first spam path)

- **Integration note:** Phase 5’s first spam / reputation wire path is **Twilio REST** (§5.2). Env flag [`SPAM_PROVIDER_TWILIO_ENABLED`](src/lib/spam/provider-flags.ts) toggles that adapter; the stub pipeline uses `twilio_stub`. [`CLAIM_EVENT_SOURCE_VALUES`](src/lib/constants/claimEvent.ts) uses `twilio` as the `claim_events.source` for Twilio API–backed events.

## 2026-05-15 (Phase 5.1 — spam types + provider env flags)

- **§5.1 contracts:** [`SpamCheckResult`](src/lib/spam/types.ts) and [`SpamCheckProvider`](src/lib/spam/types.ts) define the adapter surface for Nomorobo (§5.3) and Twilio (§5.2). Env toggles via [`getSpamProviderFeatureFlags`](src/lib/spam/provider-flags.ts). Vitest: [`provider-flags.test.ts`](src/lib/spam/provider-flags.test.ts).

## 2026-05-15 (Phase 4.6 — loading, partial failures, retry, structured logs)

- **§4.6 `/check` UX + API:** While [`POST /api/check/submit`](src/app/api/check/submit/route.ts) runs, [`CheckFunnelClient`](src/components/check/check-funnel-client.tsx) shows per-number skeleton rows. Successful phone submits extend JSON with **`number_checks`** — parallel stub “providers” per number ([`parallel-check-pipeline-stub.ts`](src/lib/check/parallel-check-pipeline-stub.ts), Vitest [`parallel-check-pipeline-stub.test.ts`](src/lib/check/parallel-check-pipeline-stub.test.ts)); one failing provider still returns others. **Retry with backoff** (cap 8s) after consecutive submit failures; provider / pipeline failures log **`error_code`** via structured `console.error` JSON (`check_provider_failure`, `check_number_pipeline_failure`, `check_submit_unhandled`).
- **§4.6 follow-ups:** Stubs **always succeed in production** until you optionally add env-driven failure for staging. **Phase 5** replaces **`runStubChecksForPhoneList`** with **Nomorobo** + **Twilio** adapters but **can keep the same `number_checks` shape**. Per-number progress is skeleton until the single response returns (**not streaming** until SSE or split requests).

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

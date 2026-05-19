/**
 * CI-P.5.1 — Paid Company Intelligence rounds (SerpAPI + OpenRouter synthesis).
 *
 * Policy: anonymous `/check` may **enqueue** a pending run (compounds `seed_violations`
 * cache via free Round 1 / Lane A reuse) but **paid** HTTP runs only when the submit
 * had an authenticated user id, unless `COMPANY_INTEL_ALLOW_ANONYMOUS_PAID_ROUNDS=true`.
 *
 * **CI-3** orchestrator and **CI-4** source adapters must call `shouldRunPaidIntelRounds`
 * before SerpAPI or synthesis. **CI-1** enqueue is not gated by this helper.
 */

import {
  getCompanyIntelligenceFeatureFlags,
  type CompanyIntelligenceEnv,
} from "@/lib/company-intelligence/company-intelligence-flags";

export type PaidIntelRoundsInput = {
  /** Auth user id from `POST /api/check/submit` (`user?.id`); null for anonymous cookie session. */
  authenticatedUserId: string | null;
};

/**
 * Whether SerpAPI + OpenRouter synthesis rounds may run for this check subject.
 */
export function shouldRunPaidIntelRounds(
  input: PaidIntelRoundsInput,
  env: CompanyIntelligenceEnv = process.env,
): boolean {
  if (input.authenticatedUserId) {
    return true;
  }

  const { allowAnonymousPaidRounds } = getCompanyIntelligenceFeatureFlags(env);
  return allowAnonymousPaidRounds;
}

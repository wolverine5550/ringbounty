/**
 * Company Intelligence Agent — server env flags (CI-P.4 / CI-P.5).
 */

import { parseBooleanEnv } from "@/lib/spam/provider-flags";

/** When false/unset (v1 default), agent never sets `company_identified` — see `shouldPromoteToIdentified`. */
export const COMPANY_INTEL_AUTO_PROMOTE_ENABLED_ENV_KEY =
  "COMPANY_INTEL_AUTO_PROMOTE_ENABLED" as const;

/**
 * When false/unset (v1 default), SerpAPI + OpenRouter synthesis run only for signed-in
 * check submits — see `shouldRunPaidIntelRounds` (CI-P.5.1).
 */
export const COMPANY_INTEL_ALLOW_ANONYMOUS_PAID_ROUNDS_ENV_KEY =
  "COMPANY_INTEL_ALLOW_ANONYMOUS_PAID_ROUNDS" as const;

export type CompanyIntelligenceEnv = Record<string, string | undefined>;

export type CompanyIntelligenceFeatureFlags = {
  /** v1 production default: false — suggest-only until counsel false-positive review (CI-P.4). */
  autoPromoteEnabled: boolean;
  /** v1 production default: false — paid API rounds require `authenticatedUserId` (CI-P.5.1). */
  allowAnonymousPaidRounds: boolean;
};

/**
 * Returns whether agent synthesis may auto-set `company_identified` (v2+ only).
 * Omit `env` in production; pass a bag in Vitest.
 */
export function getCompanyIntelligenceFeatureFlags(
  env: CompanyIntelligenceEnv = process.env,
): CompanyIntelligenceFeatureFlags {
  return {
    autoPromoteEnabled: parseBooleanEnv(
      env[COMPANY_INTEL_AUTO_PROMOTE_ENABLED_ENV_KEY],
    ),
    allowAnonymousPaidRounds: parseBooleanEnv(
      env[COMPANY_INTEL_ALLOW_ANONYMOUS_PAID_ROUNDS_ENV_KEY],
    ),
  };
}

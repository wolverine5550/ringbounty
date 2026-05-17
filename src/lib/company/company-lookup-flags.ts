/**
 * Phase 6.4 — Feature flags for third-party company identification (server env).
 */

import { parseBooleanEnv } from "@/lib/spam/provider-flags";

export const WHITEPAGES_COMPANY_LOOKUP_ENV_KEY =
  "WHITEPAGES_COMPANY_LOOKUP_ENABLED" as const;
export const WHITEPAGES_API_KEY_ENV_KEY = "WHITEPAGES_API_KEY" as const;

export type CompanyLookupFeatureFlags = {
  whitepagesEnabled: boolean;
};

export type CompanyLookupEnv = Record<string, string | undefined>;

export function getCompanyLookupFeatureFlags(
  env: CompanyLookupEnv = process.env,
): CompanyLookupFeatureFlags {
  return {
    whitepagesEnabled: parseBooleanEnv(env[WHITEPAGES_COMPANY_LOOKUP_ENV_KEY]),
  };
}

export function getWhitepagesApiKey(
  env: CompanyLookupEnv = process.env,
): string | undefined {
  const key = env[WHITEPAGES_API_KEY_ENV_KEY]?.trim();
  return key ? key : undefined;
}

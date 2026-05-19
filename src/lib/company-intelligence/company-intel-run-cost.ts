/**
 * CI-4.3 — Estimated marginal cost per Lane B run (SerpAPI + OpenRouter).
 *
 * Uses fixed per-call cent defaults (env-overridable) for ops dashboards and O3 circuit breaker.
 * Free rounds (seed, Lane A reuse) add zero cost.
 */

import type { CompanyIntelligenceEnv } from "./company-intelligence-flags";
import type { SerpapiComplaintSearchResult } from "./sources/serpapi-complaint-search";

/** Canonical API ids stored in `apis_called` and `claim_events`. */
export const COMPANY_INTEL_API_SERPAPI = "serpapi" as const;
export const COMPANY_INTEL_API_OPENROUTER = "openrouter" as const;

export const COMPANY_INTEL_API_IDS = [
  COMPANY_INTEL_API_SERPAPI,
  COMPANY_INTEL_API_OPENROUTER,
] as const;

export type CompanyIntelApiId = (typeof COMPANY_INTEL_API_IDS)[number];

/** Env override: cents per SerpAPI Google search (default ~$0.01). */
export const COMPANY_INTEL_SERPAPI_COST_CENTS_ENV_KEY =
  "COMPANY_INTEL_SERPAPI_COST_CENTS" as const;

/** Env override: cents per OpenRouter synthesis HTTP attempt (default ~$0.05). */
export const COMPANY_INTEL_OPENROUTER_COST_CENTS_ENV_KEY =
  "COMPANY_INTEL_OPENROUTER_COST_CENTS" as const;

/** Default SerpAPI search estimate (1 cent). */
export const DEFAULT_COMPANY_INTEL_SERPAPI_COST_CENTS = 1;

/** Default OpenRouter synthesis attempt estimate (5 cents). */
export const DEFAULT_COMPANY_INTEL_OPENROUTER_COST_CENTS = 5;

export type CompanyIntelBillingInput = {
  serpapiBilled: boolean;
  openRouterHttpAttempts: number;
};

export type CompanyIntelRunCost = {
  estimatedCostCents: number;
  apisCalled: CompanyIntelApiId[];
};

function parsePositiveIntEnv(
  env: CompanyIntelligenceEnv,
  key: string,
  fallback: number,
): number {
  const raw = env[key]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

/**
 * Resolves per-SerpAPI-search cost in cents (CI-4.3).
 */
export function getSerpapiCostCentsPerCall(
  env: CompanyIntelligenceEnv = process.env,
): number {
  return parsePositiveIntEnv(
    env,
    COMPANY_INTEL_SERPAPI_COST_CENTS_ENV_KEY,
    DEFAULT_COMPANY_INTEL_SERPAPI_COST_CENTS,
  );
}

/**
 * Resolves per-OpenRouter-HTTP-attempt cost in cents (CI-4.3).
 */
export function getOpenRouterCostCentsPerAttempt(
  env: CompanyIntelligenceEnv = process.env,
): number {
  return parsePositiveIntEnv(
    env,
    COMPANY_INTEL_OPENROUTER_COST_CENTS_ENV_KEY,
    DEFAULT_COMPANY_INTEL_OPENROUTER_COST_CENTS,
  );
}

/**
 * SerpAPI bills when an HTTP search was attempted (success, API error, or transport error).
 * Skips before HTTP (disabled, missing key, invalid phone) are free.
 */
export function isSerpapiBilled(serp: SerpapiComplaintSearchResult): boolean {
  const reason = serp.skippedReason;
  if (reason === null) {
    return true;
  }
  return reason === "http_error" || reason === "parse_error";
}

/**
 * CI-4.3.1 — Computes `estimated_cost_cents` and `apis_called[]` for a completed agent run.
 */
export function computeCompanyIntelRunCost(
  input: CompanyIntelBillingInput,
  env: CompanyIntelligenceEnv = process.env,
): CompanyIntelRunCost {
  const apisCalled: CompanyIntelApiId[] = [];
  let estimatedCostCents = 0;

  if (input.serpapiBilled) {
    apisCalled.push(COMPANY_INTEL_API_SERPAPI);
    estimatedCostCents += getSerpapiCostCentsPerCall(env);
  }

  const attempts = Math.max(0, Math.floor(input.openRouterHttpAttempts));
  if (attempts > 0) {
    apisCalled.push(COMPANY_INTEL_API_OPENROUTER);
    estimatedCostCents += getOpenRouterCostCentsPerAttempt(env) * attempts;
  }

  return { estimatedCostCents, apisCalled };
}

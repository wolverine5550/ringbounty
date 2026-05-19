/**
 * CI-3.1 — Orchestrator thresholds (short-circuit + Lane A metadata reuse window).
 */

import type { CompanyIntelligenceEnv } from "./company-intelligence-flags";

export const COMPANY_INTEL_SHORT_CIRCUIT_THRESHOLD_ENV_KEY =
  "COMPANY_INTEL_SHORT_CIRCUIT_THRESHOLD" as const;

/** Default matches CI-3.1.4 product spec (stop when confidence ≥ 70). */
export const COMPANY_INTEL_SHORT_CIRCUIT_THRESHOLD_DEFAULT = 70;

export const COMPANY_INTEL_LANE_A_REUSE_MAX_AGE_MS_ENV_KEY =
  "COMPANY_INTEL_LANE_A_REUSE_MAX_AGE_MS" as const;

/** Reuse `metadata.spam_providers` from check submit when subject row is fresh (24h). */
export const COMPANY_INTEL_LANE_A_REUSE_MAX_AGE_MS_DEFAULT = 24 * 60 * 60 * 1000;

function parsePositiveIntEnv(
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

/** CI-3.1.4 — stop orchestrator when aggregated or synthesis confidence reaches this (0–100). */
export function getCompanyIntelShortCircuitThreshold(
  env: CompanyIntelligenceEnv = process.env,
): number {
  const threshold = parsePositiveIntEnv(
    env[COMPANY_INTEL_SHORT_CIRCUIT_THRESHOLD_ENV_KEY],
    COMPANY_INTEL_SHORT_CIRCUIT_THRESHOLD_DEFAULT,
  );
  return Math.min(100, threshold);
}

/** Max age of `claim_subjects.created_at` for Round 2 Lane A metadata reuse (CI-3.1.3). */
export function getLaneAMetadataReuseMaxAgeMs(
  env: CompanyIntelligenceEnv = process.env,
): number {
  return parsePositiveIntEnv(
    env[COMPANY_INTEL_LANE_A_REUSE_MAX_AGE_MS_ENV_KEY],
    COMPANY_INTEL_LANE_A_REUSE_MAX_AGE_MS_DEFAULT,
  );
}

/**
 * When true, Round 2 skips cached Nomorobo/Twilio/Whitepages JSON (no HTTP refetch in CI-3.1).
 */
export function isLaneASpamMetadataStale(
  subjectUpdatedAtIso: string | null | undefined,
  nowMs: number = Date.now(),
  maxAgeMs: number = COMPANY_INTEL_LANE_A_REUSE_MAX_AGE_MS_DEFAULT,
): boolean {
  if (!subjectUpdatedAtIso) {
    return true;
  }
  const updatedMs = Date.parse(subjectUpdatedAtIso);
  if (!Number.isFinite(updatedMs)) {
    return true;
  }
  return nowMs - updatedMs > maxAgeMs;
}

/**
 * Phase 6.1 — Federal DNC access spike (PRD §7 Step 4, §8 +25 points).
 *
 * v0.1: automated National DNC Registry lookup is unavailable. See
 * `docs/spikes/20260516190000-federal-dnc-access.md`.
 */

import { FEDERAL_DNC_UNAVAILABLE_USER_MESSAGE } from "@/lib/constants/federal-dnc-unavailable";

/** Paths considered during §6.1.1 research; only one is active in v0.1. */
export const FEDERAL_DNC_ACCESS_PATHS = [
  "ftc_dnc_complaints_api",
  "paid_vendor",
  "manual_attestation",
  "unavailable",
] as const;

export type FederalDncAccessPath = (typeof FEDERAL_DNC_ACCESS_PATHS)[number];

/** Locked v0.1 path until §6.2 integrates a vendor or validated API. */
export const FEDERAL_DNC_V01_ACCESS_PATH: FederalDncAccessPath =
  "manual_attestation";

export type FederalDncCheckStatus = "unavailable" | "not_run" | "completed";

export type FederalDncCheckSummary = {
  status: FederalDncCheckStatus;
  automated_check_available: boolean;
  access_path: FederalDncAccessPath;
  user_message: string;
};

/**
 * Whether the app may call an external service for federal registry lookup.
 * False for v0.1 — prevents §6.2 clients from running without explicit enablement.
 */
export function isFederalDncAutomatedCheckAvailable(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const flag = env.FEDERAL_DNC_AUTOMATED_ENABLED?.trim().toLowerCase();
  if (flag === "true" || flag === "1" || flag === "yes") {
    return true;
  }
  return false;
}

/** Status for API + UI while automated lookup is off. */
export function getFederalDncCheckStatus(
  env?: Record<string, string | undefined>,
): FederalDncCheckStatus {
  return isFederalDncAutomatedCheckAvailable(env)
    ? "not_run"
    : "unavailable";
}

/** JSON fragment for `POST /api/check/submit` (claim-level, not per spammer number). */
export function getFederalDncCheckSummaryForClient(
  env?: Record<string, string | undefined>,
): FederalDncCheckSummary {
  const automated = isFederalDncAutomatedCheckAvailable(env);
  return {
    status: getFederalDncCheckStatus(env),
    automated_check_available: automated,
    access_path: automated ? "paid_vendor" : FEDERAL_DNC_V01_ACCESS_PATH,
    user_message: automated ? "" : FEDERAL_DNC_UNAVAILABLE_USER_MESSAGE,
  };
}

/**
 * Phase 8.2.4 — `claim_events` keys for statute-of-limitations outputs.
 */

import type { ClaimEventType } from "@/lib/constants/claimEvent";

/** Persisted under `value_calculated` for Phase 8 scoring audit (§8.2.4 / §8.5.2). */
export const SOL_VALUE_CALCULATED_EVENT: ClaimEventType = "value_calculated";

export const SOL_CLAIM_EVENT_KEYS = {
  withinFederalSol: "within_federal_sol",
  withinStateSol: "within_state_sol",
  likelyTimeBarred: "likely_time_barred",
  federalSolYears: "federal_sol_years",
  stateSolYears: "state_sol_years",
  mostRecentCallDate: "most_recent_call_date",
} as const;

export const SOL_CLAIM_EVENT_KEY_LIST = Object.values(SOL_CLAIM_EVENT_KEYS);

export type PersistedSolFlags = {
  withinFederalSol: boolean;
  withinStateSol: boolean | null;
  likelyTimeBarred: boolean;
  federalSolYears: number;
  stateSolYears: number | null;
  mostRecentCallDate: string;
};

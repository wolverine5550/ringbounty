/**
 * Phase 8.2.2–8.2.3 — Compute federal/state SOL flags from most recent call date.
 *
 * PRD §7 Step 5:
 *   within_* = most_recent_call_date >= (today - N years)
 *   likely_time_barred when both federal and state are outside SOL.
 */

import { FEDERAL_TCPA_SOL_YEARS } from "./federal-sol-years";
import { getStateSolYears, isRecognizedUsState } from "./state-sol-years";
import { subtractUtcYears, toUtcDateOnly } from "./sol-date";

export type SolFlagsResult = {
  withinFederalSol: boolean;
  /** Null when profile state is unknown — cannot evaluate state SOL. */
  withinStateSol: boolean | null;
  likelyTimeBarred: boolean;
  federalSolYears: number;
  stateSolYears: number | null;
};

export type ComputeSolFlagsParams = {
  mostRecentCallDate: string;
  userState?: string | null;
  /** Injectable for Vitest (defaults to UTC today). */
  referenceDate?: Date;
};

function isOnOrAfterCutoff(
  callDate: Date,
  referenceDate: Date,
  solYears: number,
): boolean {
  const cutoff = subtractUtcYears(referenceDate, solYears);
  return callDate.getTime() >= cutoff.getTime();
}

/**
 * Derives PRD §7 Step 5 SOL booleans from Q10 `most_recent_call_date`.
 */
export function computeSolFlags(params: ComputeSolFlagsParams): SolFlagsResult | null {
  const callDate = toUtcDateOnly(params.mostRecentCallDate);
  if (!callDate) {
    return null;
  }

  const reference = params.referenceDate
    ? toUtcDateOnly(params.referenceDate)
    : toUtcDateOnly(new Date());
  if (!reference) {
    return null;
  }

  const federalSolYears = FEDERAL_TCPA_SOL_YEARS;
  const withinFederalSol = isOnOrAfterCutoff(
    callDate,
    reference,
    federalSolYears,
  );

  const stateRaw = params.userState?.trim() ?? "";
  let withinStateSol: boolean | null = null;
  let stateSolYears: number | null = null;

  if (stateRaw && isRecognizedUsState(stateRaw)) {
    stateSolYears = getStateSolYears(stateRaw);
    withinStateSol = isOnOrAfterCutoff(callDate, reference, stateSolYears);
  }

  const likelyTimeBarred =
    withinFederalSol === false && withinStateSol === false;

  return {
    withinFederalSol,
    withinStateSol,
    likelyTimeBarred,
    federalSolYears,
    stateSolYears,
  };
}

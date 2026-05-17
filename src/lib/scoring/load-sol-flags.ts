/**
 * Phase 8.2 — Load latest persisted SOL flags for `/results` (§8.2.3).
 */

import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  SOL_CLAIM_EVENT_KEY_LIST,
  SOL_CLAIM_EVENT_KEYS,
  SOL_VALUE_CALCULATED_EVENT,
  type PersistedSolFlags,
} from "./sol-claim-events";

function parseBooleanValue(value: string | null | undefined): boolean | null {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
}

/**
 * Latest SOL snapshot for a claim (most recent `value_calculated` row per key).
 */
export async function loadSolFlags(
  supabase: SupabaseClient<Database>,
  claimId: string,
): Promise<PersistedSolFlags | null> {
  const { data, error } = await supabase
    .from("claim_events")
    .select("key, value, created_at")
    .eq("claim_id", claimId)
    .eq("event_type", SOL_VALUE_CALCULATED_EVENT)
    .in("key", SOL_CLAIM_EVENT_KEY_LIST)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const latest = new Map<string, string | null>();
  for (const row of data ?? []) {
    if (row.key && !latest.has(row.key)) {
      latest.set(row.key, row.value);
    }
  }

  const mostRecentCallDate = latest.get(SOL_CLAIM_EVENT_KEYS.mostRecentCallDate);
  if (!mostRecentCallDate) {
    return null;
  }

  const withinFederalSol = parseBooleanValue(
    latest.get(SOL_CLAIM_EVENT_KEYS.withinFederalSol),
  );
  const likelyTimeBarred = parseBooleanValue(
    latest.get(SOL_CLAIM_EVENT_KEYS.likelyTimeBarred),
  );
  const federalSolYearsRaw = latest.get(SOL_CLAIM_EVENT_KEYS.federalSolYears);
  const federalSolYears = federalSolYearsRaw ? Number(federalSolYearsRaw) : NaN;

  if (
    withinFederalSol === null ||
    likelyTimeBarred === null ||
    !Number.isFinite(federalSolYears)
  ) {
    return null;
  }

  const withinStateRaw = latest.get(SOL_CLAIM_EVENT_KEYS.withinStateSol);
  let withinStateSol: boolean | null = null;
  if (withinStateRaw === "unknown") {
    withinStateSol = null;
  } else {
    withinStateSol = parseBooleanValue(withinStateRaw);
  }

  const stateSolYearsRaw = latest.get(SOL_CLAIM_EVENT_KEYS.stateSolYears);
  const stateSolYears =
    stateSolYearsRaw !== undefined && stateSolYearsRaw !== null
      ? Number(stateSolYearsRaw)
      : null;

  return {
    withinFederalSol,
    withinStateSol,
    likelyTimeBarred,
    federalSolYears,
    stateSolYears:
      stateSolYears !== null && Number.isFinite(stateSolYears)
        ? stateSolYears
        : null,
    mostRecentCallDate,
  };
}

/**
 * Phase 8.2.4 — Persist SOL flags to `claim_events` (`value_calculated`).
 */

import type { ClaimEventSource } from "@/lib/constants/claimEvent";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

import { computeSolFlags } from "./compute-sol-flags";
import {
  SOL_CLAIM_EVENT_KEYS,
  SOL_VALUE_CALCULATED_EVENT,
  type PersistedSolFlags,
} from "./sol-claim-events";

const SYSTEM_SOURCE: ClaimEventSource = "system";

function valueCalculatedRow(
  claimId: string,
  key: string,
  value: string,
): Database["public"]["Tables"]["claim_events"]["Insert"] {
  return {
    claim_id: claimId,
    event_type: SOL_VALUE_CALCULATED_EVENT,
    key,
    value,
    source: SYSTEM_SOURCE,
  };
}

/**
 * Computes and inserts SOL `claim_events` after Q10 is known (Screen 3 save).
 */
export async function persistSolFlags(
  supabase: SupabaseClient<Database>,
  params: {
    claimId: string;
    mostRecentCallDate: string;
    userState?: string | null;
    referenceDate?: Date;
  },
): Promise<PersistedSolFlags | null> {
  const computed = computeSolFlags({
    mostRecentCallDate: params.mostRecentCallDate,
    userState: params.userState,
    referenceDate: params.referenceDate,
  });

  if (!computed) {
    return null;
  }

  const rows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    valueCalculatedRow(
      params.claimId,
      SOL_CLAIM_EVENT_KEYS.withinFederalSol,
      String(computed.withinFederalSol),
    ),
    valueCalculatedRow(
      params.claimId,
      SOL_CLAIM_EVENT_KEYS.likelyTimeBarred,
      String(computed.likelyTimeBarred),
    ),
    valueCalculatedRow(
      params.claimId,
      SOL_CLAIM_EVENT_KEYS.federalSolYears,
      String(computed.federalSolYears),
    ),
    valueCalculatedRow(
      params.claimId,
      SOL_CLAIM_EVENT_KEYS.mostRecentCallDate,
      params.mostRecentCallDate,
    ),
  ];

  if (computed.withinStateSol === null) {
    rows.push(
      valueCalculatedRow(
        params.claimId,
        SOL_CLAIM_EVENT_KEYS.withinStateSol,
        "unknown",
      ),
    );
  } else {
    rows.push(
      valueCalculatedRow(
        params.claimId,
        SOL_CLAIM_EVENT_KEYS.withinStateSol,
        String(computed.withinStateSol),
      ),
    );
  }

  if (computed.stateSolYears !== null) {
    rows.push(
      valueCalculatedRow(
        params.claimId,
        SOL_CLAIM_EVENT_KEYS.stateSolYears,
        String(computed.stateSolYears),
      ),
    );
  }

  const { error } = await supabase.from("claim_events").insert(rows);
  if (error) {
    throw error;
  }

  return {
    withinFederalSol: computed.withinFederalSol,
    withinStateSol: computed.withinStateSol,
    likelyTimeBarred: computed.likelyTimeBarred,
    federalSolYears: computed.federalSolYears,
    stateSolYears: computed.stateSolYears,
    mostRecentCallDate: params.mostRecentCallDate,
  };
}

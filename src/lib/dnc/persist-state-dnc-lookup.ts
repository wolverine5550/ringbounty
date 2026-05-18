/**
 * Phase 13.7.2 — Persist automated state DNC lookup to `dnc_check_results` + `claim_events`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ClaimEventSource } from "@/lib/constants/claimEvent";
import type { StateWithOwnDncRegistry } from "@/lib/constants/state-dnc-registries";
import { resolveStateDncMatrixSignal } from "@/lib/scoring/state-dnc-matrix-signal";
import type { Database } from "@/types/database";

import { normalizeStateDncLookupFields } from "./normalize-state-dnc-lookup";
import type { StateDncLookupResult } from "./state-dnc-provider";

const DNC_CHECK_EVENT = "dnc_check" as const;
const STATE_API_SOURCE: ClaimEventSource = "state_api";

export type PersistStateDncLookupParams = {
  claimId: string;
  claimSubjectId: string;
  phoneNumberNormalized: string;
  stateCode: StateWithOwnDncRegistry;
  lookup: StateDncLookupResult;
};

export type PersistStateDncLookupResult = {
  persisted: boolean;
  stateDncRegistered: boolean | null;
  matrixTier: string;
  matrixPoints: number;
};

/**
 * Upserts state DNC columns when lookup returned a definitive registered boolean.
 */
export async function persistStateDncLookup(
  supabase: SupabaseClient<Database>,
  params: PersistStateDncLookupParams,
): Promise<PersistStateDncLookupResult> {
  const fields = normalizeStateDncLookupFields(params.stateCode, params.lookup);

  const matrix = resolveStateDncMatrixSignal({
    stateDncApplicable: fields.state_dnc_applicable ?? null,
    stateDncRegistered: fields.state_dnc_registered ?? null,
  });

  if (params.lookup.registered === null) {
    return {
      persisted: false,
      stateDncRegistered: null,
      matrixTier: matrix.tier,
      matrixPoints: matrix.points,
    };
  }

  const { data: existing, error: loadError } = await supabase
    .from("dnc_check_results")
    .select("id")
    .eq("claim_subject_id", params.claimSubjectId)
    .maybeSingle();

  if (loadError) {
    throw loadError;
  }

  const patch = {
    state_dnc_applicable: fields.state_dnc_applicable,
    state_dnc_registered: fields.state_dnc_registered,
    state_dnc_state: fields.state_dnc_state,
    state_dnc_checked_at: fields.state_dnc_checked_at,
  };

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("dnc_check_results")
      .update(patch)
      .eq("id", existing.id);

    if (updateError) {
      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase.from("dnc_check_results").insert({
      claim_id: params.claimId,
      claim_subject_id: params.claimSubjectId,
      phone_number_normalized: params.phoneNumberNormalized,
      ...patch,
    });

    if (insertError) {
      throw insertError;
    }
  }

  const eventRows: Database["public"]["Tables"]["claim_events"]["Insert"][] = [
    {
      claim_id: params.claimId,
      event_type: DNC_CHECK_EVENT,
      key: "state_dnc_registered",
      value: String(fields.state_dnc_registered),
      source: STATE_API_SOURCE,
    },
    {
      claim_id: params.claimId,
      event_type: DNC_CHECK_EVENT,
      key: "state_dnc_state",
      value: params.stateCode,
      source: STATE_API_SOURCE,
    },
    {
      claim_id: params.claimId,
      event_type: DNC_CHECK_EVENT,
      key: "state_dnc_matrix_tier",
      value: matrix.tier,
      source: STATE_API_SOURCE,
    },
    {
      claim_id: params.claimId,
      event_type: DNC_CHECK_EVENT,
      key: "state_dnc_matrix_points",
      value: String(matrix.points),
      source: STATE_API_SOURCE,
    },
  ];

  const { error: eventsError } = await supabase
    .from("claim_events")
    .insert(eventRows);

  if (eventsError) {
    throw eventsError;
  }

  return {
    persisted: true,
    stateDncRegistered: fields.state_dnc_registered ?? null,
    matrixTier: matrix.tier,
    matrixPoints: matrix.points,
  };
}

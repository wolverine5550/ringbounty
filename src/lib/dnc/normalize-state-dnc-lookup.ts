/**
 * Phase 13.7.2 — Map provider lookup results to `dnc_check_results` state columns.
 */

import type { StateWithOwnDncRegistry } from "@/lib/constants/state-dnc-registries";
import type { Database } from "@/types/database";

import type { StateDncLookupResult } from "./state-dnc-provider";

export type NormalizedStateDncFields = Pick<
  Database["public"]["Tables"]["dnc_check_results"]["Update"],
  | "state_dnc_applicable"
  | "state_dnc_registered"
  | "state_dnc_state"
  | "state_dnc_checked_at"
>;

/**
 * Converts a completed provider lookup into persisted DNC row fields.
 * When `registered` is null, only scaffold fields are returned (no checked_at).
 */
export function normalizeStateDncLookupFields(
  stateCode: StateWithOwnDncRegistry,
  lookup: StateDncLookupResult,
  nowIso: string = new Date().toISOString(),
): NormalizedStateDncFields {
  const base: NormalizedStateDncFields = {
    state_dnc_applicable: true,
    state_dnc_state: stateCode,
    state_dnc_registered: lookup.registered,
    state_dnc_checked_at: null,
  };

  if (lookup.registered === null) {
    return base;
  }

  return {
    ...base,
    state_dnc_checked_at: lookup.checkedAt ?? nowIso,
  };
}

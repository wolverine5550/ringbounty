/**
 * Phase 6.3.2 — v0.1 state DNC fields on `dnc_check_results` (no API lookup).
 */

import {
  isStateWithOwnDncRegistry,
  normalizeUsStateCode,
  type StateWithOwnDncRegistry,
} from "@/lib/constants/state-dnc-registries";
import type { Database } from "@/types/database";

export type StateDncScaffoldFields = Pick<
  Database["public"]["Tables"]["dnc_check_results"]["Insert"],
  | "state_dnc_applicable"
  | "state_dnc_registered"
  | "state_dnc_state"
  | "state_dnc_checked_at"
>;

/**
 * Derives state DNC columns for v0.1:
 * - User state unknown → all null (not evaluated).
 * - State without registry → `state_dnc_applicable: false`, others null.
 * - Registry state → `state_dnc_applicable: true`, `state_dnc_state` set;
 *   `state_dnc_registered` / `state_dnc_checked_at` stay null until §13.7 APIs ship.
 */
export function deriveStateDncScaffoldFields(
  userStateRaw: string | null | undefined,
): StateDncScaffoldFields {
  const stateCode = normalizeUsStateCode(userStateRaw);
  if (!stateCode) {
    const twoLetter = userStateRaw?.trim().toUpperCase();
    if (twoLetter && /^[A-Z]{2}$/.test(twoLetter)) {
      return {
        state_dnc_applicable: false,
        state_dnc_registered: null,
        state_dnc_state: twoLetter,
        state_dnc_checked_at: null,
      };
    }
    return {
      state_dnc_applicable: null,
      state_dnc_registered: null,
      state_dnc_state: null,
      state_dnc_checked_at: null,
    };
  }

  return {
    state_dnc_applicable: true,
    state_dnc_registered: null,
    state_dnc_state: stateCode,
    state_dnc_checked_at: null,
  };
}

export function getApplicableStateDncCode(
  fields: StateDncScaffoldFields,
): StateWithOwnDncRegistry | null {
  if (
    fields.state_dnc_applicable === true &&
    fields.state_dnc_state &&
    isStateWithOwnDncRegistry(fields.state_dnc_state)
  ) {
    return fields.state_dnc_state;
  }
  return null;
}

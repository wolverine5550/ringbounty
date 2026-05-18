/**
 * Phase 13.7 — Run automated state DNC lookup when per-state flag is enabled.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { StateWithOwnDncRegistry } from "@/lib/constants/state-dnc-registries";
import type { Database } from "@/types/database";

import { persistStateDncLookup } from "./persist-state-dnc-lookup";
import {
  deriveStateDncScaffoldFields,
  getApplicableStateDncCode,
} from "./scaffold-state-dnc-row";
import { isStateDncAutomatedCheckEnabled } from "./state-dnc-flags";
import type { StateDncFlagsEnv } from "./state-dnc-flags";
import { resolveStateDncProvider } from "./resolve-state-dnc-provider";

export type RunStateDncLookupParams = {
  claimId: string;
  claimSubjectId: string;
  phoneNumberNormalized: string;
  userState: string | null | undefined;
};

export type RunStateDncLookupResult =
  | { ran: false; reason: "not_applicable" | "flag_disabled" }
  | {
      ran: true;
      stateCode: StateWithOwnDncRegistry;
      persisted: boolean;
      stateDncRegistered: boolean | null;
    };

/**
 * Looks up state DNC when user's state has a registry and env flag is on.
 * Does not throw on unavailable provider (returns persisted: false).
 */
export async function runStateDncLookupIfEnabled(
  supabase: SupabaseClient<Database>,
  params: RunStateDncLookupParams,
  env: StateDncFlagsEnv = process.env,
): Promise<RunStateDncLookupResult> {
  const stateCode = getApplicableStateDncCode(
    deriveStateDncScaffoldFields(params.userState),
  );

  if (!stateCode) {
    return { ran: false, reason: "not_applicable" };
  }

  if (!isStateDncAutomatedCheckEnabled(stateCode, env)) {
    return { ran: false, reason: "flag_disabled" };
  }

  const provider = resolveStateDncProvider(stateCode, env);
  if (!provider) {
    return { ran: false, reason: "flag_disabled" };
  }

  const lookup = await provider.check({
    phoneNumberNormalized: params.phoneNumberNormalized,
    stateCode,
  });

  const persistResult = await persistStateDncLookup(supabase, {
    claimId: params.claimId,
    claimSubjectId: params.claimSubjectId,
    phoneNumberNormalized: params.phoneNumberNormalized,
    stateCode,
    lookup,
  });

  return {
    ran: true,
    stateCode,
    persisted: persistResult.persisted,
    stateDncRegistered: persistResult.stateDncRegistered,
  };
}

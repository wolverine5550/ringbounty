/**
 * Phase 13.7.3 — Per-state feature flags for automated state DNC lookups.
 */

import {
  STATES_WITH_OWN_DNC_REGISTRY,
  type StateWithOwnDncRegistry,
} from "@/lib/constants/state-dnc-registries";
import { parseBooleanEnv } from "@/lib/spam/provider-flags";

/** Env key pattern: `STATE_DNC_TX_ENABLED`, etc. */
export function stateDncEnabledEnvKey(
  stateCode: StateWithOwnDncRegistry,
): string {
  return `STATE_DNC_${stateCode}_ENABLED`;
}

export type StateDncFeatureFlags = Record<StateWithOwnDncRegistry, boolean>;

export type StateDncFlagsEnv = Record<string, string | undefined>;

/**
 * Returns whether automated lookup is enabled for each registry state.
 */
export function getStateDncFeatureFlags(
  env: StateDncFlagsEnv = process.env,
): StateDncFeatureFlags {
  const flags = {} as StateDncFeatureFlags;
  for (const code of STATES_WITH_OWN_DNC_REGISTRY) {
    flags[code] = parseBooleanEnv(env[stateDncEnabledEnvKey(code)]);
  }
  return flags;
}

/** True when `STATE_DNC_{code}_ENABLED` is on for a registry state. */
export function isStateDncAutomatedCheckEnabled(
  stateCode: StateWithOwnDncRegistry,
  env: StateDncFlagsEnv = process.env,
): boolean {
  return parseBooleanEnv(env[stateDncEnabledEnvKey(stateCode)]);
}

/**
 * Phase 13.7 — Resolve per-state DNC provider (stub until vendor integrations ship).
 */

import type { StateWithOwnDncRegistry } from "@/lib/constants/state-dnc-registries";

import { isStateDncAutomatedCheckEnabled } from "./state-dnc-flags";
import type { StateDncFlagsEnv } from "./state-dnc-flags";
import {
  UnavailableStateDncProvider,
  type StateDncProvider,
} from "./state-dnc-provider";

/**
 * Returns a provider when the state flag is on; otherwise null (skip lookup).
 * v0.2: all enabled states use `UnavailableStateDncProvider` until real clients exist.
 */
export function resolveStateDncProvider(
  stateCode: StateWithOwnDncRegistry,
  env: StateDncFlagsEnv = process.env,
): StateDncProvider | null {
  if (!isStateDncAutomatedCheckEnabled(stateCode, env)) {
    return null;
  }

  return new UnavailableStateDncProvider(stateCode);
}

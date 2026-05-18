/**
 * Phase 6.3.3 / 13.7 — Abstract state DNC provider for per-state API integrations.
 */

import type { StateWithOwnDncRegistry } from "@/lib/constants/state-dnc-registries";

export type StateDncLookupInput = {
  phoneNumberNormalized: string;
  stateCode: StateWithOwnDncRegistry;
};

export type StateDncLookupResult = {
  /** Null when lookup did not complete or is unavailable in v0.1. */
  registered: boolean | null;
  checkedAt: string | null;
};

/**
 * Per-state registry client contract (§13.7 future integrations).
 */
export interface StateDncProvider {
  readonly stateCode: StateWithOwnDncRegistry;
  check(input: StateDncLookupInput): Promise<StateDncLookupResult>;
}

/**
 * v0.1 placeholder — never returns a positive registration (no fabricated +10).
 */
export class UnavailableStateDncProvider implements StateDncProvider {
  readonly stateCode: StateWithOwnDncRegistry;

  constructor(stateCode: StateWithOwnDncRegistry) {
    this.stateCode = stateCode;
  }

  async check(_input: StateDncLookupInput): Promise<StateDncLookupResult> {
    return {
      registered: null,
      checkedAt: null,
    };
  }
}

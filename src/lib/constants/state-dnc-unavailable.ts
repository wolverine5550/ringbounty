/**
 * Phase 6.3.2 — State DNC automated lookup not shipped in v0.1.
 */

import {
  STATE_DNC_REGISTRY_DISPLAY_NAMES,
  type StateWithOwnDncRegistry,
} from "@/lib/constants/state-dnc-registries";

/** Shown when the user's state has a registry but API integration is deferred. */
export function stateDncComingSoonMessage(
  stateCode: StateWithOwnDncRegistry,
): string {
  const name = STATE_DNC_REGISTRY_DISPLAY_NAMES[stateCode];
  return `${name} maintains its own Do Not Call list. Automated lookup is coming soon — we will not assume state registry status for scoring until you can confirm it here.`;
}

/** Generic copy when state is unknown at `/check` (anonymous flow). */
export const STATE_DNC_CHECK_GENERIC_MESSAGE =
  "Some states maintain their own Do Not Call lists in addition to the National Registry. Automated state lookups are coming soon.";

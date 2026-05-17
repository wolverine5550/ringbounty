/**
 * Phase 6.3.1 — States with their own Do Not Call registries (PRD §7 Step 4).
 *
 * v0.1: no automated state API lookups; {@link isStateWithOwnDncRegistry} gates
 * `state_dnc_applicable` on `dnc_check_results`.
 */

/** USPS two-letter codes for states with separate DNC registries (PRD §7 Step 4). */
export const STATES_WITH_OWN_DNC_REGISTRY = [
  "IN",
  "TX",
  "WY",
  "CO",
  "LA",
  "MS",
  "MO",
  "OK",
  "OR",
  "PA",
  "TN",
] as const;

export type StateWithOwnDncRegistry = (typeof STATES_WITH_OWN_DNC_REGISTRY)[number];

/** Full state names aligned with PRD list order (documentation / UI). */
export const STATE_DNC_REGISTRY_DISPLAY_NAMES: Record<
  StateWithOwnDncRegistry,
  string
> = {
  IN: "Indiana",
  TX: "Texas",
  WY: "Wyoming",
  CO: "Colorado",
  LA: "Louisiana",
  MS: "Mississippi",
  MO: "Missouri",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  TN: "Tennessee",
};

const STATE_NAME_TO_CODE: Record<string, StateWithOwnDncRegistry> =
  Object.fromEntries(
    Object.entries(STATE_DNC_REGISTRY_DISPLAY_NAMES).map(([code, name]) => [
      name.toUpperCase(),
      code as StateWithOwnDncRegistry,
    ]),
  ) as Record<string, StateWithOwnDncRegistry>;

const REGISTRY_CODE_SET = new Set<string>(STATES_WITH_OWN_DNC_REGISTRY);

/**
 * Normalizes profile `users.state` to a two-letter code when recognized.
 */
export function normalizeUsStateCode(
  raw: string | null | undefined,
): StateWithOwnDncRegistry | null {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return null;
  }
  const upper = trimmed.toUpperCase();
  if (REGISTRY_CODE_SET.has(upper)) {
    return upper as StateWithOwnDncRegistry;
  }
  const byName = STATE_NAME_TO_CODE[upper];
  return byName ?? null;
}

/** True when the user's state maintains a separate DNC registry (PRD §7 Step 4). */
export function isStateWithOwnDncRegistry(
  stateCode: string | null | undefined,
): stateCode is StateWithOwnDncRegistry {
  const normalized = normalizeUsStateCode(stateCode);
  return normalized !== null;
}

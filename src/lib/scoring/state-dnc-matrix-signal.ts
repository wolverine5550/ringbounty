/**
 * Phase 6.3 / PRD §8 — State DNC matrix points (+10 when registered).
 *
 * v0.1: never fabricates a positive — only +10 when `state_dnc_registered === true`.
 */

/** PRD §8 — State DNC registered. */
export const STATE_DNC_MATRIX_REGISTERED_POINTS = 10;

export type StateDncMatrixTier = "registered" | "none" | "unavailable";

export type StateDncMatrixSignal = {
  tier: StateDncMatrixTier;
  points: number;
};

/**
 * Derives state DNC matrix points from persisted lookup results only.
 */
export function resolveStateDncMatrixSignal(input: {
  stateDncApplicable?: boolean | null;
  stateDncRegistered?: boolean | null;
}): StateDncMatrixSignal {
  if (input.stateDncApplicable !== true) {
    return { tier: "unavailable", points: 0 };
  }

  if (input.stateDncRegistered === true) {
    return {
      tier: "registered",
      points: STATE_DNC_MATRIX_REGISTERED_POINTS,
    };
  }

  return { tier: "none", points: 0 };
}

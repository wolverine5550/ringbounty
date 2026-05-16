/**
 * Phase 6.1.3 / PRD §8 — Federal DNC matrix points (+25 when eligible).
 *
 * While automated registry lookup is unavailable, always returns 0 points so scoring
 * never fabricates a federal DNC positive.
 */

import { isFederalDncAutomatedCheckAvailable } from "@/lib/dnc/federal-dnc-access";

/** PRD §8 — Federal DNC registered and eligible (31+ days). */
export const FEDERAL_DNC_MATRIX_ELIGIBLE_POINTS = 25;

export type FederalDncMatrixTier = "eligible" | "none" | "unavailable";

export type FederalDncMatrixSignal = {
  tier: FederalDncMatrixTier;
  points: number;
};

/**
 * Derives federal DNC matrix points.
 *
 * - **Automated registry** (off in v0.1): +25 only when automated check is on and eligible.
 * - **User attestation** (§6.2): +25 when `attestedByUser` and `federalDncEligible` from
 *   user-provided dates — never from RingBounty querying the National Registry.
 */
export function resolveFederalDncMatrixSignal(
  input: {
    federalDncEligible?: boolean | null;
    automatedCheckAvailable?: boolean;
    /** Explicit qualification attestation (`source: user_input`). */
    attestedByUser?: boolean;
  },
  env?: Record<string, string | undefined>,
): FederalDncMatrixSignal {
  if (input.attestedByUser) {
    if (input.federalDncEligible === true) {
      return {
        tier: "eligible",
        points: FEDERAL_DNC_MATRIX_ELIGIBLE_POINTS,
      };
    }
    return { tier: "none", points: 0 };
  }

  const automated =
    input.automatedCheckAvailable ??
    isFederalDncAutomatedCheckAvailable(env);

  if (!automated) {
    return {
      tier: "unavailable",
      points: 0,
    };
  }

  if (input.federalDncEligible === true) {
    return {
      tier: "eligible",
      points: FEDERAL_DNC_MATRIX_ELIGIBLE_POINTS,
    };
  }

  return { tier: "none", points: 0 };
}

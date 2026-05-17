/**
 * Phase 8.3 — Three-scenario TCPA valuation (PRD §11).
 */

import {
  VALUATION_MANDATORY_CAVEAT,
  VALUATION_SOL_TIME_BARRED_ADDENDUM,
} from "@/lib/constants/valuation-caveat";

import {
  computeViolationCounts,
  type ViolationCountInput,
  type ViolationCounts,
} from "./compute-violation-counts";
import {
  TCPA_STATUTORY_STANDARD_CENTS,
  TCPA_STATUTORY_WILLFUL_CENTS,
  VALUATION_CONSERVATIVE_HIGH_VIOLATIONS,
  VALUATION_CONSERVATIVE_LOW_VIOLATIONS,
} from "./valuation-constants";

export type ValuationInput = ViolationCountInput & {
  /** When true, SOL addendum is appended to display caveat (§8.3.3). */
  likelyTimeBarred?: boolean;
};

export type ValuationScenarios = ViolationCounts & {
  conservativeLowCents: number;
  conservativeHighCents: number;
  realisticCents: number;
  maximumCents: number;
  likelyTimeBarred: boolean;
  /** Mandatory PRD caveat; includes SOL addendum when applicable. */
  displayCaveat: string;
};

function multiplyCents(rateCents: number, count: number): number {
  return rateCents * count;
}

/**
 * PRD §11 dollar scenarios — all amounts in integer cents.
 */
export function computeValuation(input: ValuationInput): ValuationScenarios {
  const counts = computeViolationCounts(input);
  const { standardViolationCount, willfulViolationCount, timeViolationCount } =
    counts;

  const conservativeLowCents = multiplyCents(
    TCPA_STATUTORY_STANDARD_CENTS,
    VALUATION_CONSERVATIVE_LOW_VIOLATIONS,
  );
  const conservativeHighCents = multiplyCents(
    TCPA_STATUTORY_STANDARD_CENTS,
    VALUATION_CONSERVATIVE_HIGH_VIOLATIONS,
  );

  const realisticCents =
    multiplyCents(TCPA_STATUTORY_STANDARD_CENTS, standardViolationCount) +
    multiplyCents(TCPA_STATUTORY_WILLFUL_CENTS, willfulViolationCount) +
    multiplyCents(TCPA_STATUTORY_STANDARD_CENTS, timeViolationCount);

  const totalViolations =
    standardViolationCount + willfulViolationCount + timeViolationCount;
  const maximumCents = multiplyCents(
    TCPA_STATUTORY_WILLFUL_CENTS,
    totalViolations,
  );

  const likelyTimeBarred = input.likelyTimeBarred === true;
  const displayCaveat = buildValuationDisplayCaveat(likelyTimeBarred);

  return {
    ...counts,
    conservativeLowCents,
    conservativeHighCents,
    realisticCents,
    maximumCents,
    likelyTimeBarred,
    displayCaveat,
  };
}

/** PRD §11 mandatory caveat; appends SOL note when `likelyTimeBarred`. */
export function buildValuationDisplayCaveat(likelyTimeBarred: boolean): string {
  if (!likelyTimeBarred) {
    return VALUATION_MANDATORY_CAVEAT;
  }
  return `${VALUATION_MANDATORY_CAVEAT} ${VALUATION_SOL_TIME_BARRED_ADDENDUM}`;
}

/** Formats integer cents as a whole-dollar USD string (e.g. "$9,000"). */
export function formatUsdFromCents(cents: number): string {
  const dollars = Math.floor(cents / 100);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);
}

import { describe, expect, it } from "vitest";

import {
  VALUATION_MANDATORY_CAVEAT,
  VALUATION_SOL_TIME_BARRED_ADDENDUM,
} from "@/lib/constants/valuation-caveat";

import { computeViolationCounts } from "./compute-violation-counts";
import {
  buildValuationDisplayCaveat,
  computeValuation,
  formatUsdFromCents,
} from "./compute-valuation";
import {
  TCPA_STATUTORY_STANDARD_CENTS,
  TCPA_STATUTORY_WILLFUL_CENTS,
} from "./valuation-constants";

/** PRD §11 worked example: 10 total, 3 post-stop willful, 2 time-of-day. */
const PRD_EXAMPLE_FIXTURE = {
  callCountTotal: 10,
  callCountAfterStop: 3,
  stopRequestIgnored: true,
  callsBefore8am: true,
  callsAfter9pm: true,
  callsAfter9pmCount: 1,
} as const;

describe("computeViolationCounts (§8.3.1)", () => {
  it("matches PRD §11 formulas for standard / willful / time", () => {
    expect(computeViolationCounts(PRD_EXAMPLE_FIXTURE)).toEqual({
      standardViolationCount: 7,
      willfulViolationCount: 3,
      timeViolationCount: 2,
    });
  });

  it("uses zero willful when stop request was not ignored", () => {
    expect(
      computeViolationCounts({
        callCountTotal: 5,
        callCountAfterStop: 2,
        stopRequestIgnored: false,
        callsBefore8am: false,
        callsAfter9pm: false,
        callsAfter9pmCount: null,
      }),
    ).toEqual({
      standardViolationCount: 5,
      willfulViolationCount: 0,
      timeViolationCount: 0,
    });
  });
});

describe("computeValuation (§8.3.2)", () => {
  it("computes conservative, realistic, and maximum in cents (PRD example)", () => {
    const result = computeValuation(PRD_EXAMPLE_FIXTURE);

    expect(result.conservativeLowCents).toBe(TCPA_STATUTORY_STANDARD_CENTS);
    expect(result.conservativeHighCents).toBe(TCPA_STATUTORY_STANDARD_CENTS * 2);
    expect(result.realisticCents).toBe(
      TCPA_STATUTORY_STANDARD_CENTS * 7 +
        TCPA_STATUTORY_WILLFUL_CENTS * 3 +
        TCPA_STATUTORY_STANDARD_CENTS * 2,
    );
    expect(result.maximumCents).toBe(TCPA_STATUTORY_WILLFUL_CENTS * 12);
    expect(formatUsdFromCents(result.realisticCents)).toBe("$9,000");
    expect(formatUsdFromCents(result.maximumCents)).toBe("$18,000");
  });

  it("handles single-call baseline with no willful or time violations", () => {
    const result = computeValuation({
      callCountTotal: 1,
      callCountAfterStop: null,
      stopRequestIgnored: false,
      callsBefore8am: false,
      callsAfter9pm: false,
      callsAfter9pmCount: null,
    });

    expect(result.standardViolationCount).toBe(1);
    expect(result.realisticCents).toBe(50_000);
    expect(result.maximumCents).toBe(150_000);
    expect(formatUsdFromCents(result.conservativeLowCents)).toBe("$500");
    expect(formatUsdFromCents(result.conservativeHighCents)).toBe("$1,000");
  });
});

describe("buildValuationDisplayCaveat (§8.3.3)", () => {
  it("returns mandatory caveat only when SOL warning is false", () => {
    expect(buildValuationDisplayCaveat(false)).toBe(VALUATION_MANDATORY_CAVEAT);
  });

  it("appends SOL addendum when likely time-barred", () => {
    const caveat = computeValuation({
      ...PRD_EXAMPLE_FIXTURE,
      likelyTimeBarred: true,
    }).displayCaveat;

    expect(caveat).toContain(VALUATION_MANDATORY_CAVEAT);
    expect(caveat).toContain(VALUATION_SOL_TIME_BARRED_ADDENDUM);
  });
});

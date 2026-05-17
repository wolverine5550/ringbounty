import { describe, expect, it } from "vitest";

import {
  STRENGTH_MATRIX_THRESHOLD_MODERATE,
  STRENGTH_MATRIX_THRESHOLD_STRONG,
  STRENGTH_MATRIX_THRESHOLD_WEAK,
} from "./strength-matrix-constants";
import {
  computeStrengthMatrix,
  mapScoreToClaimStrength,
  type StrengthMatrixInput,
} from "./strength-matrix";

/** Strong baseline: spam high + federal DNC + willful + pattern + company + RA + SOL. */
function strongBaseline(
  overrides: Partial<StrengthMatrixInput> = {},
): StrengthMatrixInput {
  return {
    isExempt: false,
    mergedSpam: {
      isKnownSpammer: true,
      confidenceScore: 90,
      isExempt: false,
    },
    federalDncEligible: true,
    attestedFederalDncByUser: true,
    stopRequestMade: true,
    callsAfterStopRequest: true,
    callCountTotal: 10,
    companyIdentified: true,
    registeredAgentFound: true,
    withinFederalSol: true,
    withinStateSol: true,
    gaveDirectConsent: false,
    hasExistingRelationship: false,
    thirdPartyConsentPossible: false,
    ...overrides,
  };
}

describe("mapScoreToClaimStrength (§8.1.4)", () => {
  it("maps PRD threshold bands", () => {
    expect(mapScoreToClaimStrength(70)).toBe("strong");
    expect(mapScoreToClaimStrength(69)).toBe("moderate");
    expect(mapScoreToClaimStrength(40)).toBe("moderate");
    expect(mapScoreToClaimStrength(39)).toBe("weak");
    expect(mapScoreToClaimStrength(10)).toBe("weak");
    expect(mapScoreToClaimStrength(9)).toBe("ineligible");
  });

  it("documents threshold constants", () => {
    expect(STRENGTH_MATRIX_THRESHOLD_STRONG).toBe(70);
    expect(STRENGTH_MATRIX_THRESHOLD_MODERATE).toBe(40);
    expect(STRENGTH_MATRIX_THRESHOLD_WEAK).toBe(10);
  });
});

describe("computeStrengthMatrix (§8.1)", () => {
  it("forces ineligible on exempt override regardless of other signals", () => {
    const result = computeStrengthMatrix(
      strongBaseline({ isExempt: true }),
    );

    expect(result.exemptOverride).toBe(true);
    expect(result.strength).toBe("ineligible");
    expect(result.totalScore).toBe(-100);
    expect(result.breakdown.some((b) => b.signal === "exempt")).toBe(true);
  });

  it("applies single-call deduction", () => {
    const result = computeStrengthMatrix(
      strongBaseline({ callCountTotal: 1 }),
    );

    expect(result.breakdown.find((b) => b.signal === "single_call")?.applied).toBe(
      true,
    );
    expect(result.breakdown.find((b) => b.signal === "call_pattern")?.applied).toBe(
      false,
    );
  });

  it("reaches strong at max positive signals", () => {
    const result = computeStrengthMatrix(
      strongBaseline({
        stateDncApplicable: true,
        stateDncRegistered: true,
        callsBefore8am: true,
        callsAfter9pm: true,
      }),
    );

    expect(result.totalScore).toBeGreaterThanOrEqual(70);
    expect(result.strength).toBe("strong");
    expect(result.exemptOverride).toBe(false);
  });

  it("consent negatives reduce a strong baseline into moderate or lower", () => {
    const withoutConsent = computeStrengthMatrix(strongBaseline());
    const withConsent = computeStrengthMatrix(
      strongBaseline({
        gaveDirectConsent: true,
        hasExistingRelationship: true,
        thirdPartyConsentPossible: true,
      }),
    );

    expect(withoutConsent.strength).toBe("strong");
    expect(withConsent.totalScore).toBeLessThan(withoutConsent.totalScore);
    expect(withConsent.strength).toBe("moderate");
    expect(withConsent.totalScore).toBe(40);
  });

  it("outside federal and state SOL applies -30", () => {
    const result = computeStrengthMatrix(
      strongBaseline({
        withinFederalSol: false,
        withinStateSol: false,
      }),
    );

    expect(
      result.breakdown.find((b) => b.signal === "outside_sol")?.applied,
    ).toBe(true);
    expect(
      result.breakdown.find((b) => b.signal === "within_federal_sol")?.applied,
    ).toBe(false);
  });

  it("weak band with modest positives offset by single-call deduction", () => {
    const result = computeStrengthMatrix({
      isExempt: false,
      mergedSpam: {
        isKnownSpammer: true,
        confidenceScore: 90,
        isExempt: false,
      },
      callCountTotal: 1,
      companyIdentified: true,
    });

    expect(result.strength).toBe("weak");
    expect(result.totalScore).toBe(20);
  });
});

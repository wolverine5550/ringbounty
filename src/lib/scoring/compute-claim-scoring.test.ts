import { describe, expect, it } from "vitest";

import { computeClaimScoring } from "./compute-claim-scoring";

describe("computeClaimScoring (§8.5)", () => {
  it("aggregates weakest-link strength across subjects", () => {
    const result = computeClaimScoring({
      subjects: [
        {
          id: "sub-a",
          is_exempt: false,
          company_identified: true,
          registered_agent_name: "Agent",
          spam_db_confidence_score: 95,
        },
        {
          id: "sub-b",
          is_exempt: false,
          company_identified: false,
          registered_agent_name: null,
          spam_db_confidence_score: null,
        },
      ],
      dncBySubject: new Map(),
      screen1: {
        gaveDirectConsent: false,
        thirdPartyConsentPossible: false,
        hasExistingRelationship: false,
      },
      screen2: {
        stopRequestMade: true,
        stopRequestMethod: "verbal",
        stopRequestDate: "2024-01-01",
        callsAfterStopRequest: true,
      },
      screen3: {
        callCountTotal: 10,
        callCountAfterStop: 5,
        callsBefore8am: false,
        callsAfter9pm: false,
        callsAfter9pmCount: null,
        mostRecentCallDate: "2024-06-01",
      },
      sol: {
        withinFederalSol: true,
        withinStateSol: true,
        likelyTimeBarred: false,
        federalSolYears: 4,
        stateSolYears: 4,
        mostRecentCallDate: "2024-06-01",
      },
    });

    expect(result.subjects).toHaveLength(2);
    expect(["strong", "moderate", "weak", "ineligible"]).toContain(
      result.claimStrength,
    );
    expect(result.claimStrengthScore).toBeLessThanOrEqual(
      Math.max(...result.subjects.map((s) => s.matrix.totalScore)),
    );
    expect(result.valuation).not.toBeNull();
  });
});

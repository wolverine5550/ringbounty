import { describe, expect, it } from "vitest";

import { shouldStopCompanyIntelligenceOrchestrator } from "./orchestrator-short-circuit";

describe("shouldStopCompanyIntelligenceOrchestrator (CI-3.1.4)", () => {
  it("stops when skipPaidRounds is true", () => {
    expect(
      shouldStopCompanyIntelligenceOrchestrator({
        sources: [],
        synthesis: null,
        skipPaidRounds: true,
        shortCircuitThreshold: 70,
      }),
    ).toBe(true);
  });

  it("stops when synthesis confidence meets threshold", () => {
    expect(
      shouldStopCompanyIntelligenceOrchestrator({
        sources: [],
        synthesis: {
          companyName: "Acme",
          confidence: 85,
          reasoning: "test",
          callbackNumbers: [],
          isSpoofedPool: false,
        },
        skipPaidRounds: false,
        shortCircuitThreshold: 70,
      }),
    ).toBe(true);
  });

  it("stops when aggregated source confidence meets threshold", () => {
    expect(
      shouldStopCompanyIntelligenceOrchestrator({
        sources: [{ tier: "nomorobo", companyName: "CarShield" }],
        synthesis: null,
        skipPaidRounds: false,
        shortCircuitThreshold: 70,
      }),
    ).toBe(true);
  });
});

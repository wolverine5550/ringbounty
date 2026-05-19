import { describe, expect, it } from "vitest";

import { shouldEnqueueCompanyIntelligenceRun } from "./should-enqueue-company-intelligence-run";

describe("shouldEnqueueCompanyIntelligenceRun (CI-1.1)", () => {
  it("returns false when agent flag is off", () => {
    expect(
      shouldEnqueueCompanyIntelligenceRun({
        agentEnabled: false,
        companyIdentified: false,
        isExempt: false,
      }),
    ).toBe(false);
  });

  it("returns false when company is identified (Nomorobo won)", () => {
    expect(
      shouldEnqueueCompanyIntelligenceRun({
        agentEnabled: true,
        companyIdentified: true,
        isExempt: false,
      }),
    ).toBe(false);
  });

  it("returns false when subject is exempt", () => {
    expect(
      shouldEnqueueCompanyIntelligenceRun({
        agentEnabled: true,
        companyIdentified: false,
        isExempt: true,
      }),
    ).toBe(false);
  });

  it("returns true for UNKNOWN / unidentified non-exempt when flag on", () => {
    expect(
      shouldEnqueueCompanyIntelligenceRun({
        agentEnabled: true,
        companyIdentified: false,
        isExempt: false,
      }),
    ).toBe(true);
  });
});

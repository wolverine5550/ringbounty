import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { runCompanyIntelligenceAgent } from "./run-company-intelligence-agent";
import * as seedModule from "./sources/seed-violations";

describe("runCompanyIntelligenceAgent (CI-2.2)", () => {
  it("returns null synthesis when seed miss", async () => {
    vi.spyOn(seedModule, "querySeedViolations").mockResolvedValue(null);

    const admin = createMockSupabaseClient();
    const result = await runCompanyIntelligenceAgent({
      admin,
      phoneNumberNormalized: "+18005551234",
      claimSubjectId: "sub-1",
      runId: "run-1",
    });

    expect(result.synthesis).toBeNull();
    expect(result.skipPaidRounds).toBe(false);
    expect(result.round1Hits).toEqual([]);
  });

  it("Path B high-count seed returns category suggest without skipping paid rounds", async () => {
    vi.spyOn(seedModule, "querySeedViolations").mockResolvedValue({
      phoneNumberNormalized: "+18005551234",
      reportedCompanyName: null,
      confidenceLevel: "ftc_complaint_high",
      violationCount: 75,
      source: "ftc_complaint",
      litigationStatus: null,
      metadata: { ftc_subject: "Other", complaint_count: 75 },
    });

    const admin = createMockSupabaseClient();
    const result = await runCompanyIntelligenceAgent({
      admin,
      phoneNumberNormalized: "+18005551234",
      claimSubjectId: "sub-1",
      runId: "run-1",
    });

    expect(result.synthesis?.companyName).toBeNull();
    expect(result.synthesis?.callCategory).toBe("Other");
    expect(result.skipPaidRounds).toBe(false);
    expect(result.round1Hits).toHaveLength(1);
  });

  it("Path A seed short-circuit skips paid rounds", async () => {
    vi.spyOn(seedModule, "querySeedViolations").mockResolvedValue({
      phoneNumberNormalized: "+18005551234",
      reportedCompanyName: "CarShield",
      confidenceLevel: "ftc_complaint_high",
      violationCount: 80,
      source: "ftc_complaint",
      litigationStatus: null,
      metadata: { complaint_count: 80 },
    });

    const admin = createMockSupabaseClient();
    const result = await runCompanyIntelligenceAgent({
      admin,
      phoneNumberNormalized: "+18005551234",
      claimSubjectId: "sub-1",
      runId: "run-1",
    });

    expect(result.synthesis?.companyName).toBe("CarShield");
    expect(result.synthesis?.confidence).toBe(85);
    expect(result.skipPaidRounds).toBe(true);
  });
});

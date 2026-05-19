import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import * as contextModule from "./load-claim-subject-intel-context";
import { runCompanyIntelligenceAgent } from "./run-company-intelligence-agent";
import * as seedModule from "./sources/seed-violations";
import * as laneAModule from "./sources/lane-a-spam-providers";

const baseContext = {
  metadata: null,
  subjectCreatedAt: new Date().toISOString(),
  authenticatedUserId: null,
};

describe("runCompanyIntelligenceAgent (CI-3.1)", () => {
  it("returns null synthesis when seed miss and no Lane A hits", async () => {
    vi.spyOn(contextModule, "loadClaimSubjectIntelContext").mockResolvedValue(
      baseContext,
    );
    vi.spyOn(seedModule, "querySeedViolations").mockResolvedValue(null);
    vi.spyOn(
      laneAModule,
      "evaluateLaneASpamProvidersRound2",
    ).mockReturnValue({
      hits: [],
      rawByProvider: {},
      reusedLaneA: false,
      skippedReason: "missing_metadata",
    });

    const admin = createMockSupabaseClient();
    const result = await runCompanyIntelligenceAgent({
      admin,
      phoneNumberNormalized: "+18005551234",
      claimSubjectId: "sub-1",
      runId: "run-1",
    });

    expect(result.synthesis).toBeNull();
    expect(result.skipPaidRounds).toBe(false);
    expect(result.allSources).toEqual([]);
    expect(result.roundAudits[0]?.round).toBe(1);
  });

  it("Path B high-count seed returns category suggest without skipping paid rounds", async () => {
    vi.spyOn(contextModule, "loadClaimSubjectIntelContext").mockResolvedValue(
      baseContext,
    );
    vi.spyOn(seedModule, "querySeedViolations").mockResolvedValue({
      phoneNumberNormalized: "+18005551234",
      reportedCompanyName: null,
      confidenceLevel: "ftc_complaint_high",
      violationCount: 75,
      source: "ftc_complaint",
      litigationStatus: null,
      metadata: { ftc_subject: "Other", complaint_count: 75 },
    });
    vi.spyOn(
      laneAModule,
      "evaluateLaneASpamProvidersRound2",
    ).mockReturnValue({
      hits: [],
      rawByProvider: {},
      reusedLaneA: false,
      skippedReason: "missing_metadata",
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
    expect(result.stoppedEarly).toBe(true);
    expect(result.allSources).toHaveLength(1);
  });

  it("Path A seed short-circuit skips paid rounds", async () => {
    vi.spyOn(contextModule, "loadClaimSubjectIntelContext").mockResolvedValue(
      baseContext,
    );
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
    expect(result.stoppedEarly).toBe(true);
  });

  it("Round 2 nomorobo reuse stops when confidence ≥ threshold", async () => {
    vi.spyOn(contextModule, "loadClaimSubjectIntelContext").mockResolvedValue({
      ...baseContext,
      metadata: { spam_providers: { nomorobo: { risk_score: 90 } } },
    });
    vi.spyOn(seedModule, "querySeedViolations").mockResolvedValue(null);
    vi.spyOn(
      laneAModule,
      "evaluateLaneASpamProvidersRound2",
    ).mockReturnValue({
      hits: [{ tier: "nomorobo", companyName: "Capital One" }],
      rawByProvider: { nomorobo: { reported_name: "Capital One" } },
      reusedLaneA: true,
      skippedReason: null,
    });

    const admin = createMockSupabaseClient();
    const result = await runCompanyIntelligenceAgent({
      admin,
      phoneNumberNormalized: "+18005551234",
      claimSubjectId: "sub-1",
      runId: "run-1",
    });

    expect(result.stoppedEarly).toBe(true);
    expect(result.synthesis?.companyName).toBe("Capital One");
    expect(result.roundAudits.some((a) => a.round === 2)).toBe(true);
  });
});

describe("runCompanyIntelligenceAgent (CI-3.3)", () => {
  it("CI-3.3.1 UNKNOWN CNAM → deterministic synthesis, no substantive name", async () => {
    vi.spyOn(contextModule, "loadClaimSubjectIntelContext").mockResolvedValue(
      baseContext,
    );
    vi.spyOn(seedModule, "querySeedViolations").mockResolvedValue(null);
    vi.spyOn(
      laneAModule,
      "evaluateLaneASpamProvidersRound2",
    ).mockReturnValue({
      hits: [{ tier: "whitepages", companyName: "UNKNOWN", confidence: 35 }],
      rawByProvider: { twilio: { caller_name: "UNKNOWN" } },
      reusedLaneA: true,
      skippedReason: null,
    });

    const admin = createMockSupabaseClient();
    const result = await runCompanyIntelligenceAgent({
      admin,
      phoneNumberNormalized: "+18005551234",
      claimSubjectId: "sub-1",
      runId: "run-1",
    });

    expect(result.synthesis).not.toBeNull();
    expect(result.synthesis?.companyName).toBeNull();
    expect(result.synthesis?.confidence).toBe(35);
    expect(result.synthesis?.reasoning).toMatch(/substantive|qualify/i);
    expect(result.stoppedEarly).toBe(false);
    expect(result.roundAudits.some((a) => a.round === 3)).toBe(true);
  });

  it("CI-3.3.2 Path A high FTC seed exits before round 3 (no SerpAPI)", async () => {
    vi.spyOn(contextModule, "loadClaimSubjectIntelContext").mockResolvedValue(
      baseContext,
    );
    vi.spyOn(seedModule, "querySeedViolations").mockResolvedValue({
      phoneNumberNormalized: "+18005551234",
      reportedCompanyName: "CarShield",
      confidenceLevel: "ftc_complaint_high",
      violationCount: 120,
      source: "ftc_complaint",
      litigationStatus: null,
      metadata: { complaint_count: 120 },
    });

    const admin = createMockSupabaseClient();
    const result = await runCompanyIntelligenceAgent({
      admin,
      phoneNumberNormalized: "+18005551234",
      claimSubjectId: "sub-1",
      runId: "run-1",
    });

    expect(result.skipPaidRounds).toBe(true);
    expect(result.stoppedEarly).toBe(true);
    expect(result.roundAudits.some((a) => a.round === 3)).toBe(false);
    expect(
      result.roundAudits.flatMap((a) => a.sourceTiers),
    ).not.toContain("serpapi");
  });

  it("CI-3.3.4 anonymous submit records paid-round skip at round 3", async () => {
    vi.spyOn(contextModule, "loadClaimSubjectIntelContext").mockResolvedValue({
      ...baseContext,
      authenticatedUserId: null,
    });
    vi.spyOn(seedModule, "querySeedViolations").mockResolvedValue(null);
    vi.spyOn(
      laneAModule,
      "evaluateLaneASpamProvidersRound2",
    ).mockReturnValue({
      hits: [],
      rawByProvider: {},
      reusedLaneA: false,
      skippedReason: "missing_metadata",
    });

    const admin = createMockSupabaseClient();
    const result = await runCompanyIntelligenceAgent({
      admin,
      phoneNumberNormalized: "+18005551234",
      claimSubjectId: "sub-1",
      runId: "run-1",
      env: { COMPANY_INTEL_ALLOW_ANONYMOUS_PAID_ROUNDS: "false" },
    });

    const round3 = result.roundAudits.find((a) => a.round === 3);
    expect(round3?.skippedReason).toBe("anonymous_paid_rounds_disabled");
    expect(round3?.sourceTiers).toEqual([]);
  });
});

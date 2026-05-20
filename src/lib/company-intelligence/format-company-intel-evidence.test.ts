import { describe, expect, it } from "vitest";

import {
  formatCompanyIntelEvidenceLines,
  parseCompanyIntelRoundAudits,
} from "./format-company-intel-evidence";

describe("parseCompanyIntelRoundAudits (CI-8.4.2)", () => {
  it("parses valid round audit JSON", () => {
    const audits = parseCompanyIntelRoundAudits([
      { round: 1, sourceTiers: ["ftc_complaint_high"], stoppedEarly: false },
      {
        round: 2,
        sourceTiers: ["nomorobo"],
        stoppedEarly: true,
        skippedReason: null,
      },
    ]);
    expect(audits).toHaveLength(2);
    expect(audits[0]?.round).toBe(1);
    expect(audits[1]?.stoppedEarly).toBe(true);
  });

  it("returns empty array for invalid JSON", () => {
    expect(parseCompanyIntelRoundAudits(null)).toEqual([]);
    expect(parseCompanyIntelRoundAudits({ round: 1 })).toEqual([]);
  });
});

describe("formatCompanyIntelEvidenceLines (CI-8.4.2)", () => {
  it("formats suggestion, reasoning, rounds, and APIs", () => {
    const lines = formatCompanyIntelEvidenceLines({
      suggestedCompanyName: "Acme Corp",
      confidence: 85,
      reasoning: "FTC seed match with high complaint volume.",
      roundAudits: [
        {
          round: 1,
          sourceTiers: ["ftc_complaint_high"],
          stoppedEarly: false,
        },
        {
          round: 3,
          sourceTiers: ["serpapi", "openrouter_synthesis"],
          stoppedEarly: false,
        },
      ],
      apisCalled: ["serpapi", "openrouter"],
    });

    expect(lines.some((l) => l.includes("Suggested company: Acme Corp"))).toBe(
      true,
    );
    expect(lines.some((l) => l.includes("confidence 85"))).toBe(true);
    expect(lines.some((l) => l.includes("Research summary:"))).toBe(true);
    expect(lines.some((l) => l.includes("Round 1:"))).toBe(true);
    expect(lines.some((l) => l.includes("SerpAPI"))).toBe(true);
    expect(lines.some((l) => l.includes("Billable APIs invoked:"))).toBe(true);
  });

  it("returns empty when snapshot has no displayable fields", () => {
    expect(formatCompanyIntelEvidenceLines(null)).toEqual([]);
    expect(
      formatCompanyIntelEvidenceLines({
        suggestedCompanyName: null,
        confidence: null,
        reasoning: null,
        roundAudits: [],
        apisCalled: null,
      }),
    ).toEqual([]);
  });

  it("includes reasoning-only fallback from subject row", () => {
    const lines = formatCompanyIntelEvidenceLines({
      suggestedCompanyName: null,
      confidence: null,
      reasoning: "Agent could not name a company; user should upload voicemail.",
      roundAudits: [],
      apisCalled: null,
    });
    expect(lines).toEqual([
      "Research summary: Agent could not name a company; user should upload voicemail.",
    ]);
  });
});

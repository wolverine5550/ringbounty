import { describe, expect, it } from "vitest";

import { buildDncSummary, buildSpamSummary } from "./subject-evidence-summaries";

describe("buildSpamSummary (§8.4.1)", () => {
  it("describes exempt subjects", () => {
    expect(
      buildSpamSummary({
        is_exempt: true,
        spam_db_confidence_score: 90,
      }),
    ).toContain("exempt");
  });

  it("describes high-confidence spam hits", () => {
    expect(
      buildSpamSummary({
        is_exempt: false,
        spam_db_confidence_score: 92,
      }),
    ).toContain("high confidence");
  });
});

describe("buildDncSummary (§8.4.1)", () => {
  it("returns placeholder when no DNC row", () => {
    expect(buildDncSummary(null)).toContain("qualification questions");
  });

  it("summarizes federal eligible registration", () => {
    expect(
      buildDncSummary({
        federal_dnc_registered: true,
        federal_dnc_eligible: true,
        state_dnc_applicable: false,
        state_dnc_registered: null,
      }),
    ).toContain("Federal Do Not Call");
  });
});

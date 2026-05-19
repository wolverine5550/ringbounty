import { describe, expect, it } from "vitest";

import { evaluateLaneASpamProvidersRound2 } from "./lane-a-spam-providers";

describe("evaluateLaneASpamProvidersRound2 (CI-3.1.3)", () => {
  const freshCreatedAt = new Date().toISOString();

  it("returns nomorobo hit from spam_providers without HTTP", () => {
    const result = evaluateLaneASpamProvidersRound2(
      {
        spam_providers: {
          nomorobo: {
            phone_number_reputation_details: {
              reported_name: "CarShield",
              reported_category: "Robocaller",
              risk_score: 94,
            },
          },
        },
      },
      freshCreatedAt,
    );

    expect(result.reusedLaneA).toBe(true);
    expect(result.hits).toEqual([
      { tier: "nomorobo", companyName: "CarShield" },
    ]);
    expect(result.rawByProvider.nomorobo).toBeDefined();
  });

  it("skips when metadata is stale by subject created_at", () => {
    const stale = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const result = evaluateLaneASpamProvidersRound2(
      {
        spam_providers: {
          nomorobo: {
            phone_number_reputation_details: {
              reported_name: "CarShield",
              risk_score: 90,
            },
          },
        },
      },
      stale,
    );

    expect(result.reusedLaneA).toBe(false);
    expect(result.skippedReason).toBe("stale_subject");
    expect(result.hits).toEqual([]);
  });

  it("includes whitepages hint from metadata patch", () => {
    const result = evaluateLaneASpamProvidersRound2(
      {
        whitepages_suggested_company_name: "Acme LLC",
        whitepages_lookup: { company_name: "Acme LLC" },
      },
      freshCreatedAt,
    );

    expect(result.hits.some((h) => h.tier === "whitepages")).toBe(true);
  });
});

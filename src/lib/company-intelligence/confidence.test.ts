import { describe, expect, it } from "vitest";

import {
  computeAggregatedConfidence,
  shouldPromoteToIdentified,
  SOURCE_CONFIDENCE,
} from "./confidence";
import type { IntelSourceHit } from "./types";

describe("SOURCE_CONFIDENCE", () => {
  it("assigns highest scores to enforcement and voicemail tiers", () => {
    expect(SOURCE_CONFIDENCE.ftc_enforcement).toBeGreaterThanOrEqual(90);
    expect(SOURCE_CONFIDENCE.voicemail_transcription).toBeGreaterThanOrEqual(90);
    expect(SOURCE_CONFIDENCE.serpapi).toBeLessThan(70);
  });
});

describe("computeAggregatedConfidence", () => {
  it("returns 0 for empty sources", () => {
    expect(computeAggregatedConfidence([])).toBe(0);
  });

  it("uses max agreeing confidence when company names match", () => {
    const sources: IntelSourceHit[] = [
      { tier: "serpapi", companyName: "Acme Corp", confidence: 50 },
      { tier: "openrouter_synthesis", companyName: "Acme Corp", confidence: 72 },
    ];
    expect(computeAggregatedConfidence(sources)).toBe(72);
  });
});

describe("shouldPromoteToIdentified", () => {
  const envOff = { COMPANY_INTEL_AUTO_PROMOTE_ENABLED: "false" };
  const envOn = { COMPANY_INTEL_AUTO_PROMOTE_ENABLED: "true" };

  it("returns false when auto-promote env is unset (v1 default)", () => {
    expect(
      shouldPromoteToIdentified({
        sources: [
          {
            tier: "ftc_enforcement",
            companyName: "Bad Actor LLC",
          },
        ],
      }),
    ).toBe(false);
  });

  it("returns false when auto-promote env is false (CI-P.4.1 production lock)", () => {
    expect(
      shouldPromoteToIdentified(
        {
          sources: [
            {
              tier: "ftc_enforcement",
              companyName: "Bad Actor LLC",
            },
          ],
        },
        envOff,
      ),
    ).toBe(false);
  });

  it("returns false for SerpAPI + LLM only even when flag is on (CI-P.4.3)", () => {
    expect(
      shouldPromoteToIdentified(
        {
          sources: [
            { tier: "serpapi", companyName: "Acme Corp" },
            { tier: "openrouter_synthesis", companyName: "Acme Corp" },
          ],
          aggregatedConfidence: 90,
        },
        envOn,
      ),
    ).toBe(false);
  });

  it("returns true for FTC enforcement + flag on (v2 path)", () => {
    expect(
      shouldPromoteToIdentified(
        {
          sources: [
            {
              tier: "ftc_enforcement",
              companyName: "Bad Actor LLC",
            },
          ],
        },
        envOn,
      ),
    ).toBe(true);
  });

  it("returns true for callback_confirmed + flag on (v2 path)", () => {
    expect(
      shouldPromoteToIdentified(
        {
          sources: [
            {
              tier: "callback_confirmed",
              companyName: "CarShield",
            },
          ],
        },
        envOn,
      ),
    ).toBe(true);
  });
});

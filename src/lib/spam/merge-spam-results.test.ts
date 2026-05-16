import { describe, expect, it } from "vitest";

import {
  mergeSpamCheckResults,
  resolveSpamDbSource,
} from "./merge-spam-results";
import type { SpamCheckResult } from "./types";

function result(
  partial: Partial<SpamCheckResult> & Pick<SpamCheckResult, "providerId">,
): SpamCheckResult {
  return {
    isSpam: false,
    score: null,
    complaints: null,
    category: null,
    companyName: null,
    raw: {},
    ...partial,
  };
}

describe("mergeSpamCheckResults", () => {
  it("ORs isSpam and takes max score and sum complaints", () => {
    const merged = mergeSpamCheckResults([
      result({
        providerId: "nomorobo",
        isSpam: true,
        score: 92,
        complaints: 10,
        category: "robocall",
      }),
      result({
        providerId: "twilio",
        isSpam: false,
        score: 40,
        complaints: null,
        category: "mobile",
      }),
    ]);
    expect(merged.isKnownSpammer).toBe(true);
    expect(merged.confidenceScore).toBe(92);
    expect(merged.complaintCount).toBe(10);
    expect(merged.callCategory).toBe("robocall");
    expect(merged.spamDbSource).toBe("nomorobo");
  });

  it("uses both when both providers flag spam", () => {
    const merged = mergeSpamCheckResults([
      result({ providerId: "nomorobo", isSpam: true, score: 90 }),
      result({ providerId: "twilio", isSpam: true, score: 85, complaints: 2 }),
    ]);
    expect(merged.spamDbSource).toBe("both");
    expect(merged.complaintCount).toBe(2);
    expect(merged.confidenceScore).toBe(90);
  });

  it("prefers Nomorobo category and company name over Twilio", () => {
    const merged = mergeSpamCheckResults([
      result({
        providerId: "nomorobo",
        category: "telemarketer",
        companyName: "Acme Corp",
      }),
      result({
        providerId: "twilio",
        category: "mobile",
        companyName: "Other",
      }),
    ]);
    expect(merged.callCategory).toBe("telemarketer");
    expect(merged.companyName).toBe("Acme Corp");
    expect(merged.companyIdentified).toBe(true);
  });

  it("falls back to Twilio category when Nomorobo has none", () => {
    const merged = mergeSpamCheckResults([
      result({ providerId: "nomorobo", category: null }),
      result({ providerId: "twilio", category: "nonfixedvoip" }),
    ]);
    expect(merged.callCategory).toBe("nonfixedvoip");
  });

  it("flags political category as TCPA-exempt (PRD §6)", () => {
    const merged = mergeSpamCheckResults([
      result({ providerId: "nomorobo", category: "political" }),
      result({ providerId: "twilio", category: "mobile" }),
    ]);
    expect(merged.isExempt).toBe(true);
    expect(merged.exemptReason).toBe("tcpa_exempt_political");
  });

  it("ignores skipped providers for spam OR and source", () => {
    const merged = mergeSpamCheckResults([
      result({
        providerId: "nomorobo",
        isSpam: true,
        raw: { skipped: true, reason: "disabled" },
      }),
      result({ providerId: "twilio", isSpam: true, score: 88 }),
    ]);
    expect(merged.isKnownSpammer).toBe(true);
    expect(merged.spamDbSource).toBe("twilio");
    expect(merged.confidenceScore).toBe(88);
  });
});

describe("resolveSpamDbSource", () => {
  it("returns none when no active provider flags spam", () => {
    expect(
      resolveSpamDbSource([
        result({ providerId: "nomorobo", isSpam: false }),
        result({ providerId: "twilio", isSpam: false }),
      ]),
    ).toBe("none");
  });
});

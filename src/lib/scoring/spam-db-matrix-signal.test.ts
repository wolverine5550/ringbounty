import { describe, expect, it } from "vitest";

import type { MergedSpamCheckOutcome } from "@/lib/spam/merge-spam-results";

import {
  resolveSpamDbMatrixSignal,
  SPAM_DB_MATRIX_HIGH_CONFIDENCE_POINTS,
  SPAM_DB_MATRIX_LOW_CONFIDENCE_POINTS,
  SPAM_DB_MATRIX_NO_MATCH_POINTS,
} from "./spam-db-matrix-signal";

function merged(
  partial: Partial<MergedSpamCheckOutcome>,
): MergedSpamCheckOutcome {
  return {
    isKnownSpammer: false,
    confidenceScore: null,
    complaintCount: null,
    callCategory: null,
    companyName: null,
    companyNameSource: null,
    companyIdentified: false,
    companyNameHint: null,
    companyNameHintSource: null,
    spamDbSource: "none",
    isExempt: false,
    exemptReason: null,
    ...partial,
  };
}

describe("resolveSpamDbMatrixSignal", () => {
  it("returns high tier when known spammer with score ≥ 80", () => {
    expect(
      resolveSpamDbMatrixSignal(
        merged({ isKnownSpammer: true, confidenceScore: 92 }),
      ),
    ).toEqual({ tier: "high", points: SPAM_DB_MATRIX_HIGH_CONFIDENCE_POINTS });
  });

  it("returns high tier when known spammer with null score", () => {
    expect(
      resolveSpamDbMatrixSignal(
        merged({ isKnownSpammer: true, confidenceScore: null }),
      ),
    ).toEqual({ tier: "high", points: SPAM_DB_MATRIX_HIGH_CONFIDENCE_POINTS });
  });

  it("returns low tier when score is below threshold and not known spammer", () => {
    expect(
      resolveSpamDbMatrixSignal(
        merged({ isKnownSpammer: false, confidenceScore: 65 }),
      ),
    ).toEqual({ tier: "low", points: SPAM_DB_MATRIX_LOW_CONFIDENCE_POINTS });
  });

  it("returns none / zero when no score and not known spammer (no DB match)", () => {
    expect(
      resolveSpamDbMatrixSignal(
        merged({ isKnownSpammer: false, confidenceScore: null }),
      ),
    ).toEqual({ tier: "none", points: SPAM_DB_MATRIX_NO_MATCH_POINTS });
  });

  it("returns none / zero for exempt rows (exempt -100 is Phase 8)", () => {
    expect(
      resolveSpamDbMatrixSignal(
        merged({
          isExempt: true,
          isKnownSpammer: true,
          confidenceScore: 99,
        }),
      ),
    ).toEqual({ tier: "none", points: SPAM_DB_MATRIX_NO_MATCH_POINTS });
  });
});

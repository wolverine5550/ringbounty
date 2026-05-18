import { describe, expect, it } from "vitest";

import type { ClaimQuerySnapshot } from "./successful-query";

/**
 * Mirrors `requiresAccountWall` in loadClaimGateStatusByClaimId — any completed check
 * (subjects persisted) ends the anonymous free lookup.
 */
function requiresAccountWallForSnapshot(snapshot: ClaimQuerySnapshot): boolean {
  return snapshot.subjects.length > 0;
}

describe("anonymous free lookup gate", () => {
  it("does not require account wall before first check", () => {
    expect(
      requiresAccountWallForSnapshot({
        claim: { claim_strength: null },
        subjects: [],
      }),
    ).toBe(false);
  });

  it("requires account wall after one check regardless of spam hit", () => {
    expect(
      requiresAccountWallForSnapshot({
        claim: { claim_strength: null },
        subjects: [
          {
            is_exempt: false,
            call_category: null,
            spam_db_complaint_count: 0,
          },
        ],
      }),
    ).toBe(true);
  });
});

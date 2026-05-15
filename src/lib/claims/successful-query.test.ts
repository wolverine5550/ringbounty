import { describe, expect, it } from "vitest";

import {
  isSuccessfulQuery,
  type ClaimQuerySnapshot,
} from "@/lib/claims/successful-query";

function snap(
  partial: Partial<ClaimQuerySnapshot["claim"]> & {
    subjects?: ClaimQuerySnapshot["subjects"];
  },
): ClaimQuerySnapshot {
  return {
    claim: { claim_strength: partial.claim_strength ?? null },
    subjects: partial.subjects ?? [],
  };
}

describe("isSuccessfulQuery", () => {
  it("returns false for ineligible strength regardless of subjects", () => {
    expect(
      isSuccessfulQuery(
        snap({
          claim_strength: "ineligible",
          subjects: [
            {
              is_exempt: false,
              call_category: "scammer",
              spam_db_complaint_count: 99,
            },
          ],
        }),
      ),
    ).toBe(false);
  });

  it("returns true for strong | moderate | weak strength", () => {
    for (const s of ["strong", "moderate", "weak"] as const) {
      expect(
        isSuccessfulQuery(
          snap({
            claim_strength: s,
            subjects: [],
          }),
        ),
      ).toBe(true);
    }
  });

  it("returns false when strength is null and there are no subjects", () => {
    expect(isSuccessfulQuery(snap({ claim_strength: null, subjects: [] }))).toBe(
      false,
    );
  });

  it("returns false when exempt subject has spam-like category", () => {
    expect(
      isSuccessfulQuery(
        snap({
          claim_strength: null,
          subjects: [
            {
              is_exempt: true,
              call_category: "scammer",
              spam_db_complaint_count: null,
            },
          ],
        }),
      ),
    ).toBe(false);
  });

  it("returns true when a non-exempt subject has a spam-like call_category", () => {
    expect(
      isSuccessfulQuery(
        snap({
          claim_strength: null,
          subjects: [
            {
              is_exempt: false,
              call_category: "robocall",
              spam_db_complaint_count: null,
            },
          ],
        }),
      ),
    ).toBe(true);
  });

  it("returns true when a non-exempt subject has spam_db_complaint_count > 0", () => {
    expect(
      isSuccessfulQuery(
        snap({
          claim_strength: null,
          subjects: [
            {
              is_exempt: false,
              call_category: "unknown",
              spam_db_complaint_count: 1,
            },
          ],
        }),
      ),
    ).toBe(true);
  });

  it("treats spam_db_complaint_count 0 as not a hit", () => {
    expect(
      isSuccessfulQuery(
        snap({
          claim_strength: null,
          subjects: [
            {
              is_exempt: false,
              call_category: "unknown",
              spam_db_complaint_count: 0,
            },
          ],
        }),
      ),
    ).toBe(false);
  });
});

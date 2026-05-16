import { describe, expect, it } from "vitest";

import { getEmailCaptureTrigger } from "./email-capture-trigger";
import type { ClaimQuerySnapshot } from "./successful-query";

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

describe("getEmailCaptureTrigger", () => {
  it("shows capture for ineligible strength", () => {
    expect(
      getEmailCaptureTrigger(
        snap({
          claim_strength: "ineligible",
          subjects: [
            {
              is_exempt: false,
              call_category: "scammer",
              spam_db_complaint_count: 1,
            },
          ],
        }),
      ),
    ).toEqual({
      showEmailCapture: true,
      emailCaptureReason: "ineligible_check",
    });
  });

  it("shows debt-collection interest capture when all exempt subjects are debt collection", () => {
    expect(
      getEmailCaptureTrigger(
        snap({
          subjects: [
            {
              is_exempt: true,
              call_category: "debt_collector",
              spam_db_complaint_count: null,
            },
          ],
        }),
      ),
    ).toEqual({
      showEmailCapture: true,
      emailCaptureReason: "debt_collection_interest",
    });
  });

  it("shows exempt_only capture when all subjects are exempt but not all debt collection", () => {
    expect(
      getEmailCaptureTrigger(
        snap({
          subjects: [
            {
              is_exempt: true,
              call_category: "political",
              spam_db_complaint_count: null,
            },
          ],
        }),
      ),
    ).toEqual({
      showEmailCapture: true,
      emailCaptureReason: "exempt_only",
    });
  });

  it("hides capture for mixed exempt and non-exempt", () => {
    expect(
      getEmailCaptureTrigger(
        snap({
          subjects: [
            {
              is_exempt: true,
              call_category: null,
              spam_db_complaint_count: null,
            },
            {
              is_exempt: false,
              call_category: "telemarketer",
              spam_db_complaint_count: null,
            },
          ],
        }),
      ),
    ).toEqual({
      showEmailCapture: false,
      emailCaptureReason: null,
    });
  });
});

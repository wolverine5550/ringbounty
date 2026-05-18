import { describe, expect, it } from "vitest";

import type { NumberCheckSummary } from "@/lib/check/parallel-check-pipeline-stub";

import {
  allNumberChecksExempt,
  buildCheckFunnelContinueTarget,
  pickQualifySubjectId,
} from "./check-funnel-continue";

function row(
  partial: Partial<NumberCheckSummary> & Pick<NumberCheckSummary, "phone_number_normalized">,
): NumberCheckSummary {
  return {
    claim_subject_id: null,
    providers: [],
    had_provider_failure: false,
    ...partial,
  };
}

describe("pickQualifySubjectId", () => {
  it("skips exempt rows", () => {
    const id = pickQualifySubjectId(
      [
        row({
          phone_number_normalized: "+12125550199",
          is_exempt: true,
          claim_subject_id: "exempt-id",
        }),
        row({
          phone_number_normalized: "+12125550200",
          is_exempt: false,
          claim_subject_id: "eligible-id",
        }),
      ],
      [],
    );
    expect(id).toBe("eligible-id");
  });
});

describe("allNumberChecksExempt", () => {
  it("is true only when every row is exempt", () => {
    expect(
      allNumberChecksExempt([
        row({ phone_number_normalized: "+1", is_exempt: true }),
      ]),
    ).toBe(true);
    expect(
      allNumberChecksExempt([
        row({ phone_number_normalized: "+1", is_exempt: true }),
        row({ phone_number_normalized: "+2", is_exempt: false }),
      ]),
    ).toBe(false);
  });
});

describe("buildCheckFunnelContinueTarget", () => {
  it("returns qualify href and sign-in when account wall required", () => {
    const target = buildCheckFunnelContinueTarget({
      claimId: "claim-1",
      claimSubjectIds: ["sub-1"],
      numberChecks: [
        row({
          phone_number_normalized: "+12125550199",
          claim_subject_id: "sub-1",
        }),
      ],
      requiresAccountWall: true,
    });
    expect(target?.qualifyHref).toBe("/qualify/sub-1?claim=claim-1");
    expect(target?.signInHref).toContain("/login?next=");
  });

  it("omits sign-in when wall not required", () => {
    const target = buildCheckFunnelContinueTarget({
      claimId: "claim-1",
      claimSubjectIds: ["sub-1"],
      numberChecks: [
        row({
          phone_number_normalized: "+12125550199",
          claim_subject_id: "sub-1",
        }),
      ],
      requiresAccountWall: false,
    });
    expect(target?.signInHref).toBeNull();
  });
});

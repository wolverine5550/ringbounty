import { describe, expect, it } from "vitest";

import type { NumberCheckSummary } from "@/lib/check/parallel-check-pipeline-stub";

import { hasCompanyIntelEnqueuedOnCheck } from "./check-company-intel-background";

function row(
  partial: Partial<NumberCheckSummary> &
    Pick<NumberCheckSummary, "phone_number_normalized">,
): NumberCheckSummary {
  return {
    claim_subject_id: null,
    providers: [],
    had_provider_failure: false,
    ...partial,
  };
}

describe("hasCompanyIntelEnqueuedOnCheck (CI-8.3.1)", () => {
  it("is true when any row has company_intel_enqueued", () => {
    expect(
      hasCompanyIntelEnqueuedOnCheck([
        row({ phone_number_normalized: "+12125550199" }),
        row({
          phone_number_normalized: "+12125550200",
          company_intel_enqueued: true,
        }),
      ]),
    ).toBe(true);
  });

  it("is false when no row was enqueued", () => {
    expect(
      hasCompanyIntelEnqueuedOnCheck([
        row({ phone_number_normalized: "+12125550199" }),
      ]),
    ).toBe(false);
  });
});

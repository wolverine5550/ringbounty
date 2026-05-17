import { describe, expect, it } from "vitest";

import {
  isTcpaLetterBlockedForUnidentifiedCompany,
  TCPA_LETTER_BLOCKED_COMPANY_UNIDENTIFIED,
} from "./company-identification";

describe("company-identification (§6.4)", () => {
  it("blocks letter when company not identified and not exempt", () => {
    expect(
      isTcpaLetterBlockedForUnidentifiedCompany({
        companyIdentified: false,
        isExempt: false,
      }),
    ).toBe(true);
  });

  it("does not block when identified or exempt", () => {
    expect(
      isTcpaLetterBlockedForUnidentifiedCompany({
        companyIdentified: true,
        isExempt: false,
      }),
    ).toBe(false);
    expect(
      isTcpaLetterBlockedForUnidentifiedCompany({
        companyIdentified: false,
        isExempt: true,
      }),
    ).toBe(false);
  });

  it("uses stable claim_events token", () => {
    expect(TCPA_LETTER_BLOCKED_COMPANY_UNIDENTIFIED).toBe(
      "company_unidentified",
    );
  });
});

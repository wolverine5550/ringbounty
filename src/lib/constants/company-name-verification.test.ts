import { describe, expect, it } from "vitest";

import {
  COMPANY_NAME_UNVERIFIED_WARNING,
  isCompanyNameVerificationStatus,
  USER_INPUT_VERIFIED,
} from "./company-name-verification";

describe("company-name-verification (§7.5.1b)", () => {
  it("recognizes verification status values", () => {
    expect(isCompanyNameVerificationStatus(USER_INPUT_VERIFIED)).toBe(true);
    expect(isCompanyNameVerificationStatus("other")).toBe(false);
  });

  it("includes unverified warning copy", () => {
    expect(COMPANY_NAME_UNVERIFIED_WARNING).toContain(
      "couldn't verify",
    );
  });
});

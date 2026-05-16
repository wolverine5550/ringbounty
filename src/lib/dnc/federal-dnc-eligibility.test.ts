import { describe, expect, it } from "vitest";

import { computeFederalDncEligibleFromDates } from "./federal-dnc-eligibility";

describe("computeFederalDncEligibleFromDates (§6.2)", () => {
  it("eligible when registration is 31+ days before earliest call", () => {
    // Registered Oct 17, 2007; earliest call Jan 1, 2008 — well past 31 days
    expect(
      computeFederalDncEligibleFromDates("2007-10-17", "2008-01-01"),
    ).toBe(true);
  });

  it("ineligible when registration is fewer than 31 days before earliest call", () => {
    expect(
      computeFederalDncEligibleFromDates("2024-06-01", "2024-06-15"),
    ).toBe(false);
  });

  it("eligible on exactly the 31-day boundary", () => {
    expect(
      computeFederalDncEligibleFromDates("2024-01-01", "2024-02-01"),
    ).toBe(true);
  });

  it("returns false for invalid dates", () => {
    expect(
      computeFederalDncEligibleFromDates("not-a-date", "2024-01-01"),
    ).toBe(false);
  });
});

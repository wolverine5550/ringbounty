import { describe, expect, it } from "vitest";

import {
  deriveStateDncScaffoldFields,
  getApplicableStateDncCode,
} from "./scaffold-state-dnc-row";

describe("deriveStateDncScaffoldFields (§6.3.2)", () => {
  it("returns nulls when user state unknown", () => {
    expect(deriveStateDncScaffoldFields(null)).toEqual({
      state_dnc_applicable: null,
      state_dnc_registered: null,
      state_dnc_state: null,
      state_dnc_checked_at: null,
    });
  });

  it("marks registry state applicable with null lookup fields", () => {
    expect(deriveStateDncScaffoldFields("CO")).toEqual({
      state_dnc_applicable: true,
      state_dnc_registered: null,
      state_dnc_state: "CO",
      state_dnc_checked_at: null,
    });
  });

  it("marks non-registry two-letter state not applicable", () => {
    expect(deriveStateDncScaffoldFields("CA")).toEqual({
      state_dnc_applicable: false,
      state_dnc_registered: null,
      state_dnc_state: "CA",
      state_dnc_checked_at: null,
    });
  });

  it("getApplicableStateDncCode returns code only when applicable", () => {
    expect(
      getApplicableStateDncCode(deriveStateDncScaffoldFields("Pennsylvania")),
    ).toBe("PA");
    expect(getApplicableStateDncCode(deriveStateDncScaffoldFields("NY"))).toBe(
      null,
    );
  });
});

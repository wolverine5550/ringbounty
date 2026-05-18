import { describe, expect, it } from "vitest";

import { normalizeStateDncLookupFields } from "./normalize-state-dnc-lookup";

describe("normalizeStateDncLookupFields (§13.7.2)", () => {
  it("sets checked_at when registered is boolean", () => {
    const fields = normalizeStateDncLookupFields(
      "IN",
      { registered: true, checkedAt: "2026-05-17T12:00:00.000Z" },
      "2026-05-17T12:00:00.000Z",
    );
    expect(fields).toEqual({
      state_dnc_applicable: true,
      state_dnc_state: "IN",
      state_dnc_registered: true,
      state_dnc_checked_at: "2026-05-17T12:00:00.000Z",
    });
  });

  it("leaves checked_at null when lookup incomplete", () => {
    const fields = normalizeStateDncLookupFields("TX", {
      registered: null,
      checkedAt: null,
    });
    expect(fields.state_dnc_checked_at).toBeNull();
    expect(fields.state_dnc_registered).toBeNull();
  });
});

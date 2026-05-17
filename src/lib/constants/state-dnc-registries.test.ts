import { describe, expect, it } from "vitest";

import {
  isStateWithOwnDncRegistry,
  normalizeUsStateCode,
  STATES_WITH_OWN_DNC_REGISTRY,
} from "./state-dnc-registries";

describe("state-dnc-registries (§6.3.1)", () => {
  it("lists eleven PRD registry states", () => {
    expect(STATES_WITH_OWN_DNC_REGISTRY).toHaveLength(11);
    expect(STATES_WITH_OWN_DNC_REGISTRY).toContain("CO");
    expect(STATES_WITH_OWN_DNC_REGISTRY).toContain("TX");
  });

  it("normalizes two-letter codes and full names", () => {
    expect(normalizeUsStateCode("co")).toBe("CO");
    expect(normalizeUsStateCode("Indiana")).toBe("IN");
    expect(normalizeUsStateCode("California")).toBeNull();
  });

  it("detects registry states", () => {
    expect(isStateWithOwnDncRegistry("OR")).toBe(true);
    expect(isStateWithOwnDncRegistry("CA")).toBe(false);
  });
});

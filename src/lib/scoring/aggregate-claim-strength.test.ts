import { describe, expect, it } from "vitest";

import {
  aggregateClaimStrength,
  resolveEffectiveClaimStrength,
} from "./aggregate-claim-strength";

describe("aggregateClaimStrength (§8.4)", () => {
  it("returns weakest band across subjects", () => {
    expect(aggregateClaimStrength(["strong", "moderate", "weak"])).toBe("weak");
    expect(aggregateClaimStrength(["strong", "ineligible"])).toBe("ineligible");
  });

  it("returns null for empty input", () => {
    expect(aggregateClaimStrength([])).toBeNull();
  });
});

describe("resolveEffectiveClaimStrength", () => {
  it("prefers persisted claim_strength when set", () => {
    expect(
      resolveEffectiveClaimStrength({
        persisted: "moderate",
        computed: "strong",
      }),
    ).toBe("moderate");
  });

  it("falls back to computed when persisted is null", () => {
    expect(
      resolveEffectiveClaimStrength({
        persisted: null,
        computed: "weak",
      }),
    ).toBe("weak");
  });
});

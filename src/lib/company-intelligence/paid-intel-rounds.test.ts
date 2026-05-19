import { describe, expect, it } from "vitest";

import { shouldRunPaidIntelRounds } from "./paid-intel-rounds";

describe("shouldRunPaidIntelRounds (CI-P.5.1)", () => {
  const envOff = { COMPANY_INTEL_ALLOW_ANONYMOUS_PAID_ROUNDS: "false" };
  const envOn = { COMPANY_INTEL_ALLOW_ANONYMOUS_PAID_ROUNDS: "true" };

  it("returns true when authenticatedUserId is set", () => {
    expect(
      shouldRunPaidIntelRounds(
        { authenticatedUserId: "user-uuid-123" },
        envOff,
      ),
    ).toBe(true);
  });

  it("returns false for anonymous when env is unset (v1 default)", () => {
    expect(
      shouldRunPaidIntelRounds({ authenticatedUserId: null }),
    ).toBe(false);
  });

  it("returns false for anonymous when env is false", () => {
    expect(
      shouldRunPaidIntelRounds({ authenticatedUserId: null }, envOff),
    ).toBe(false);
  });

  it("returns true for anonymous only when override env is true", () => {
    expect(
      shouldRunPaidIntelRounds({ authenticatedUserId: null }, envOn),
    ).toBe(true);
  });
});

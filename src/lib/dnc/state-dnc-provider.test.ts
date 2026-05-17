import { describe, expect, it } from "vitest";

import { UnavailableStateDncProvider } from "./state-dnc-provider";

describe("UnavailableStateDncProvider (§6.3.3)", () => {
  it("returns null registration (no fabricated positives)", async () => {
    const provider = new UnavailableStateDncProvider("TX");
    const result = await provider.check({
      phoneNumberNormalized: "+15551234567",
      stateCode: "TX",
    });
    expect(result.registered).toBeNull();
    expect(result.checkedAt).toBeNull();
    expect(provider.stateCode).toBe("TX");
  });
});

import { describe, expect, it } from "vitest";

import { resolveStateDncProvider } from "./resolve-state-dnc-provider";

describe("resolveStateDncProvider (§13.7)", () => {
  it("returns null when flag is off", () => {
    expect(resolveStateDncProvider("PA", {})).toBeNull();
  });

  it("returns unavailable provider when flag is on", () => {
    const provider = resolveStateDncProvider("PA", {
      STATE_DNC_PA_ENABLED: "true",
    });
    expect(provider?.stateCode).toBe("PA");
  });
});

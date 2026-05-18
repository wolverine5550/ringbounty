import { describe, expect, it } from "vitest";

import {
  getStateDncFeatureFlags,
  isStateDncAutomatedCheckEnabled,
  stateDncEnabledEnvKey,
} from "./state-dnc-flags";

describe("state-dnc-flags (§13.7.3)", () => {
  it("builds per-state env keys", () => {
    expect(stateDncEnabledEnvKey("TX")).toBe("STATE_DNC_TX_ENABLED");
  });

  it("defaults all flags to false", () => {
    const flags = getStateDncFeatureFlags({});
    expect(flags.TX).toBe(false);
    expect(flags.IN).toBe(false);
  });

  it("parses enabled flag for one state", () => {
    expect(
      isStateDncAutomatedCheckEnabled("CO", { STATE_DNC_CO_ENABLED: "true" }),
    ).toBe(true);
    expect(
      isStateDncAutomatedCheckEnabled("CO", { STATE_DNC_CO_ENABLED: "false" }),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  getStateSosBusinessSearchUrl,
  STATE_SOS_GENERIC_FALLBACK_URL,
} from "./registered-agent-lookup";

describe("getStateSosBusinessSearchUrl", () => {
  it("returns mapped URL for top states", () => {
    expect(getStateSosBusinessSearchUrl("CA")).toContain("sos.ca.gov");
    expect(getStateSosBusinessSearchUrl("TX")).toContain("sos.state.tx.us");
  });

  it("falls back to NASS index", () => {
    expect(getStateSosBusinessSearchUrl("ZZ")).toBe(
      STATE_SOS_GENERIC_FALLBACK_URL,
    );
  });
});

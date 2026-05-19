import { describe, expect, it } from "vitest";

import {
  COMPANY_INTEL_SHORT_CIRCUIT_THRESHOLD_DEFAULT,
  getCompanyIntelShortCircuitThreshold,
  getLaneAMetadataReuseMaxAgeMs,
  isLaneASpamMetadataStale,
} from "./orchestrator-policy";

describe("orchestrator-policy (CI-3.1)", () => {
  it("defaults short-circuit threshold to 70", () => {
    expect(getCompanyIntelShortCircuitThreshold({})).toBe(
      COMPANY_INTEL_SHORT_CIRCUIT_THRESHOLD_DEFAULT,
    );
  });

  it("parses COMPANY_INTEL_SHORT_CIRCUIT_THRESHOLD from env", () => {
    expect(
      getCompanyIntelShortCircuitThreshold({
        COMPANY_INTEL_SHORT_CIRCUIT_THRESHOLD: "80",
      }),
    ).toBe(80);
  });

  it("treats fresh subject created_at as reusable Lane A metadata", () => {
    const now = Date.now();
    const recent = new Date(now - 60_000).toISOString();
    expect(isLaneASpamMetadataStale(recent, now, 86_400_000)).toBe(false);
  });

  it("treats old subject created_at as stale", () => {
    const now = Date.now();
    const old = new Date(now - getLaneAMetadataReuseMaxAgeMs() - 1).toISOString();
    expect(isLaneASpamMetadataStale(old, now)).toBe(true);
  });
});

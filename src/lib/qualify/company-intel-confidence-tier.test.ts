import { describe, expect, it } from "vitest";

import {
  formatCompanyIntelConfidenceTierLabel,
  resolveCompanyIntelConfidenceTier,
} from "./company-intel-confidence-tier";

describe("resolveCompanyIntelConfidenceTier (CI-8.2.2)", () => {
  it("returns null when confidence is missing", () => {
    expect(resolveCompanyIntelConfidenceTier(null)).toBeNull();
    expect(resolveCompanyIntelConfidenceTier(undefined)).toBeNull();
  });

  it("maps FTC-aligned thresholds", () => {
    expect(resolveCompanyIntelConfidenceTier(95)).toBe("high");
    expect(resolveCompanyIntelConfidenceTier(85)).toBe("high");
    expect(resolveCompanyIntelConfidenceTier(84)).toBe("medium");
    expect(resolveCompanyIntelConfidenceTier(70)).toBe("medium");
    expect(resolveCompanyIntelConfidenceTier(69)).toBe("low");
    expect(resolveCompanyIntelConfidenceTier(0)).toBe("low");
  });
});

describe("formatCompanyIntelConfidenceTierLabel", () => {
  it("returns user-facing labels", () => {
    expect(formatCompanyIntelConfidenceTierLabel("high")).toContain("High");
    expect(formatCompanyIntelConfidenceTierLabel("medium")).toContain("Medium");
    expect(formatCompanyIntelConfidenceTierLabel("low")).toContain("Low");
  });
});

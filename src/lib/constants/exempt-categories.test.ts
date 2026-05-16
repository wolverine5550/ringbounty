import { describe, expect, it } from "vitest";

import {
  EXEMPT_CATEGORIES,
  EXEMPT_TCPA_USER_MESSAGE,
  isExemptCallCategory,
  resolveExemptCategory,
  resolveExemptFromCallCategory,
} from "./exempt-categories";

describe("exempt-categories (PRD §6)", () => {
  it("lists six spam-DB-detectable exempt categories (EBR excluded)", () => {
    expect(EXEMPT_CATEGORIES).toHaveLength(6);
    expect(EXEMPT_CATEGORIES).not.toContain("ebr");
  });

  it("recognizes PRD categories and common vendor aliases", () => {
    expect(resolveExemptCategory("political")).toBe("political");
    expect(resolveExemptCategory("Charity")).toBe("charity");
    expect(resolveExemptCategory("Debt Collector")).toBe("debt_collection");
    expect(resolveExemptCategory("health_care")).toBe("healthcare");
    expect(resolveExemptCategory("robocall")).toBeNull();
    expect(isExemptCallCategory("survey")).toBe(true);
  });

  it("resolveExemptFromCallCategory sets reason token when exempt", () => {
    const political = resolveExemptFromCallCategory("political");
    expect(political.isExempt).toBe(true);
    expect(political.exemptReason).toBe("tcpa_exempt_political");

    const robocall = resolveExemptFromCallCategory("robocall");
    expect(robocall.isExempt).toBe(false);
    expect(robocall.exemptReason).toBeNull();
  });

  it("exposes PRD neutral user message", () => {
    expect(EXEMPT_TCPA_USER_MESSAGE).toMatch(/exempt from TCPA/i);
    expect(EXEMPT_TCPA_USER_MESSAGE).toMatch(/excluded/i);
  });
});

import { describe, expect, it } from "vitest";

import {
  parseQualifyCompanyName,
  parseQualifyScreen4Body,
} from "./screen-4-company-identification";

describe("screen-4-company-identification (§7.5)", () => {
  it("accepts valid company names", () => {
    expect(parseQualifyCompanyName("  Acme Corp  ")).toBe("Acme Corp");
  });

  it("rejects short company names", () => {
    expect(parseQualifyCompanyName("A")).toEqual({
      error: "company_name must be at least 2 characters",
    });
  });

  it("parses screen 4 body", () => {
    expect(
      parseQualifyScreen4Body({
        company_name: "Capital One",
        has_additional_evidence: true,
        company_callback_phone: "8005551212",
      }),
    ).toMatchObject({
      companyName: "Capital One",
      hasAdditionalEvidence: true,
      companyCallbackPhone: "8005551212",
    });
  });

  it("requires has_additional_evidence boolean", () => {
    expect(
      parseQualifyScreen4Body({
        company_name: "Acme",
        has_additional_evidence: "yes",
      }),
    ).toEqual({
      error: "has_additional_evidence must be true or false",
    });
  });
});

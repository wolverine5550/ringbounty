import { describe, expect, it } from "vitest";

import {
  parseQualifyCompanyName,
  parseQualifyScreen4Body,
} from "./screen-4-company-identification";

describe("screen-4-company-identification (§7.5)", () => {
  it("accepts valid company names", () => {
    expect(parseQualifyCompanyName("  Acme Corp  ")).toBe("Acme Corp");
  });

  it("allows empty company name", () => {
    expect(parseQualifyCompanyName("")).toBeNull();
    expect(parseQualifyCompanyName("   ")).toBeNull();
  });

  it("rejects too-short non-empty company names", () => {
    expect(parseQualifyCompanyName("A")).toEqual({
      error: "company_name must be at least 2 characters when provided",
    });
  });

  it("parses body with omitted company name", () => {
    expect(
      parseQualifyScreen4Body({
        company_name: "",
        has_voicemail: false,
        has_additional_evidence: false,
      }),
    ).toMatchObject({
      companyName: null,
      hasVoicemailForUpload: false,
      hasAdditionalEvidence: false,
      companyCallbackPhone: null,
      additionalEvidencePaths: [],
    });
  });

  it("parses screen 4 body with voicemail context fields", () => {
    expect(
      parseQualifyScreen4Body({
        company_name: "Capital One",
        has_voicemail: true,
        has_additional_evidence: true,
        company_callback_phone: "8005551212",
      }),
    ).toMatchObject({
      companyName: "Capital One",
      hasVoicemailForUpload: true,
      hasAdditionalEvidence: true,
      companyCallbackPhone: "8005551212",
    });
  });

  it("ignores callback and pitch when has_voicemail is false", () => {
    expect(
      parseQualifyScreen4Body({
        company_name: "Acme",
        has_voicemail: false,
        has_additional_evidence: true,
        company_callback_phone: "8005551212",
        company_product_pitch: "Solar panels",
      }),
    ).toMatchObject({
      companyCallbackPhone: null,
      companyProductPitch: null,
    });
  });

  it("requires has_additional_evidence boolean", () => {
    expect(
      parseQualifyScreen4Body({
        company_name: "Acme",
        has_voicemail: false,
        has_additional_evidence: "yes",
      }),
    ).toEqual({
      error: "has_additional_evidence must be true or false",
    });
  });

  it("requires has_voicemail boolean", () => {
    expect(
      parseQualifyScreen4Body({
        company_name: "Acme",
        has_additional_evidence: false,
      }),
    ).toEqual({
      error: "has_voicemail must be true or false",
    });
  });
});

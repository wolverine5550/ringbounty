import { describe, expect, it } from "vitest";

import {
  CONSENT_GENERIC_COMPANY_LABEL,
  formatCompanyConsentPrompt,
  isNamedCompanyForConsent,
  resolveCompanyConsentLabel,
} from "./format-company-consent-prompt";

describe("isNamedCompanyForConsent", () => {
  it("rejects UNKNOWN and empty names", () => {
    expect(isNamedCompanyForConsent("UNKNOWN")).toBe(false);
    expect(isNamedCompanyForConsent("")).toBe(false);
    expect(isNamedCompanyForConsent("Acme")).toBe(true);
  });
});

describe("resolveCompanyConsentLabel", () => {
  it("uses the company name when known", () => {
    expect(resolveCompanyConsentLabel("Acme Corp")).toBe("Acme Corp");
  });

  it("maps UNKNOWN and empty to generic label", () => {
    expect(resolveCompanyConsentLabel("UNKNOWN")).toBe(
      CONSENT_GENERIC_COMPANY_LABEL,
    );
    expect(resolveCompanyConsentLabel("")).toBe(CONSENT_GENERIC_COMPANY_LABEL);
  });
});

describe("formatCompanyConsentPrompt", () => {
  it("substitutes company name", () => {
    expect(
      formatCompanyConsentPrompt("Did you contact {{company}}?", "Acme Corp"),
    ).toBe("Did you contact Acme Corp?");
  });

  it("uses generic label for UNKNOWN", () => {
    expect(
      formatCompanyConsentPrompt(
        "Did you give {{company}} permission?",
        "UNKNOWN",
      ),
    ).toBe(`Did you give ${CONSENT_GENERIC_COMPANY_LABEL} permission?`);
  });
});

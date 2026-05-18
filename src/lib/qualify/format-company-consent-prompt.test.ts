import { describe, expect, it } from "vitest";

import { formatCompanyConsentPrompt } from "./format-company-consent-prompt";

describe("formatCompanyConsentPrompt", () => {
  it("substitutes company name", () => {
    expect(
      formatCompanyConsentPrompt("Did you contact {{company}}?", "Acme Corp"),
    ).toBe("Did you contact Acme Corp?");
  });

  it("uses fallback when name is empty", () => {
    expect(formatCompanyConsentPrompt("Calls from {{company}}", "")).toContain(
      "the company you identified",
    );
  });
});

import { describe, expect, it } from "vitest";

import {
  parseQualificationBooleanValue,
  parseQualifyScreen1Body,
  shouldShowEbrExplainer,
} from "./screen-1-consent";

describe("screen-1-consent (§7.2)", () => {
  it("parses boolean event values", () => {
    expect(parseQualificationBooleanValue("true")).toBe(true);
    expect(parseQualificationBooleanValue("false")).toBe(false);
    expect(parseQualificationBooleanValue(null)).toBeNull();
    expect(parseQualificationBooleanValue("maybe")).toBeNull();
  });

  it("shows EBR explainer when Q1 or Q3 is yes", () => {
    expect(
      shouldShowEbrExplainer({
        gaveDirectConsent: true,
        hasExistingRelationship: false,
      }),
    ).toBe(true);
    expect(
      shouldShowEbrExplainer({
        gaveDirectConsent: false,
        hasExistingRelationship: true,
      }),
    ).toBe(true);
    expect(
      shouldShowEbrExplainer({
        gaveDirectConsent: false,
        hasExistingRelationship: false,
      }),
    ).toBe(false);
  });

  it("parses valid API body without third-party field (defaults false)", () => {
    const parsed = parseQualifyScreen1Body({
      gave_direct_consent: false,
      has_existing_relationship: false,
    });
    expect("error" in parsed).toBe(false);
    if (!("error" in parsed)) {
      expect(parsed.thirdPartyConsentPossible).toBe(false);
    }
  });

  it("rejects incomplete API body", () => {
    const parsed = parseQualifyScreen1Body({
      gave_direct_consent: false,
    });
    expect(parsed).toEqual({
      error: "has_existing_relationship must be true or false",
    });
  });
});

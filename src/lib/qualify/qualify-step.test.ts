import { describe, expect, it } from "vitest";

import {
  buildQualifyPageHref,
  isFederalDncAttestationComplete,
  parseQualifyStepFromQuery,
  resolveQualifyWizardStep,
} from "./qualify-step";

describe("qualify-step (§7.1.3)", () => {
  it("parses valid step query values", () => {
    expect(parseQualifyStepFromQuery("1")).toBe(1);
    expect(parseQualifyStepFromQuery("4")).toBe(4);
  });

  it("rejects invalid step query values", () => {
    expect(parseQualifyStepFromQuery(null)).toBeNull();
    expect(parseQualifyStepFromQuery("0")).toBeNull();
    expect(parseQualifyStepFromQuery("5")).toBeNull();
    expect(parseQualifyStepFromQuery("x")).toBeNull();
  });

  it("resolves URL step over resume", () => {
    expect(
      resolveQualifyWizardStep({ urlStep: 3, resumeStep: 2 }),
    ).toBe(3);
  });

  it("falls back to resume then default 1", () => {
    expect(resolveQualifyWizardStep({ urlStep: null, resumeStep: 2 })).toBe(2);
    expect(resolveQualifyWizardStep({ urlStep: null, resumeStep: null })).toBe(
      1,
    );
  });

  it("buildQualifyPageHref includes step and claim", () => {
    expect(
      buildQualifyPageHref({
        claimSubjectId: "sub-1",
        step: 2,
        claimId: "claim-1",
      }),
    ).toBe("/qualify/sub-1?step=2&claim=claim-1");
  });

  it("detects federal DNC attestation completion", () => {
    expect(isFederalDncAttestationComplete(true)).toBe(true);
    expect(isFederalDncAttestationComplete(false)).toBe(true);
    expect(isFederalDncAttestationComplete(null)).toBe(false);
    expect(isFederalDncAttestationComplete(undefined)).toBe(false);
  });
});

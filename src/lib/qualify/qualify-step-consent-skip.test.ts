import { describe, expect, it } from "vitest";

import {
  resolveQualifyPreviousStep,
  resolveWizardStepAfterCompanyScreen,
} from "./qualify-step";

describe("consent step skip routing", () => {
  it("skips step 5 when company is UNKNOWN", () => {
    expect(resolveWizardStepAfterCompanyScreen("UNKNOWN")).toBe(6);
    expect(resolveWizardStepAfterCompanyScreen("Capital One")).toBe(5);
  });

  it("step 6 previous goes to 4 when consent skipped", () => {
    expect(resolveQualifyPreviousStep(6, "UNKNOWN")).toBe(4);
    expect(resolveQualifyPreviousStep(6, "Acme Corp")).toBe(5);
  });
});

import { describe, expect, it } from "vitest";

import { shouldPollQualifyCompanyIntel } from "./use-qualify-company-intel-poll";

describe("shouldPollQualifyCompanyIntel (CI-8.2.4)", () => {
  it("polls only while pending or running", () => {
    expect(shouldPollQualifyCompanyIntel("pending")).toBe(true);
    expect(shouldPollQualifyCompanyIntel("running")).toBe(true);
    expect(shouldPollQualifyCompanyIntel("completed")).toBe(false);
    expect(shouldPollQualifyCompanyIntel("failed")).toBe(false);
    expect(shouldPollQualifyCompanyIntel(null)).toBe(false);
  });
});

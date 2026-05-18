import { describe, expect, it } from "vitest";

import { isSubstantiveCompanyName } from "./company-identification";

describe("isSubstantiveCompanyName", () => {
  it("rejects UNKNOWN and other placeholders", () => {
    expect(isSubstantiveCompanyName("UNKNOWN")).toBe(false);
    expect(isSubstantiveCompanyName("n/a")).toBe(false);
    expect(isSubstantiveCompanyName("")).toBe(false);
  });

  it("accepts real company names", () => {
    expect(isSubstantiveCompanyName("Acme Corp")).toBe(true);
    expect(isSubstantiveCompanyName("Capital One")).toBe(true);
  });
});

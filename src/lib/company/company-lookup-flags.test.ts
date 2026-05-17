import { describe, expect, it } from "vitest";

import {
  getCompanyLookupFeatureFlags,
  getWhitepagesApiKey,
} from "./company-lookup-flags";

describe("company-lookup-flags (§6.4.2)", () => {
  it("parses Whitepages enabled flag", () => {
    expect(
      getCompanyLookupFeatureFlags({
        WHITEPAGES_COMPANY_LOOKUP_ENABLED: "true",
      }).whitepagesEnabled,
    ).toBe(true);
    expect(
      getCompanyLookupFeatureFlags({
        WHITEPAGES_COMPANY_LOOKUP_ENABLED: "false",
      }).whitepagesEnabled,
    ).toBe(false);
  });

  it("reads API key when set", () => {
    expect(
      getWhitepagesApiKey({ WHITEPAGES_API_KEY: "  abc  " }),
    ).toBe("abc");
  });
});

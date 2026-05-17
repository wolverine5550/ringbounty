import { describe, expect, it } from "vitest";

import { lookupCompanyFromFtcComplaints } from "./ftc-complaints-company-lookup";

describe("lookupCompanyFromFtcComplaints (§6.4.2 spike)", () => {
  it("returns disabled when flag off", async () => {
    const r = await lookupCompanyFromFtcComplaints({
      phoneNumberNormalized: "+18155457907",
      env: { FTC_DNC_COMPLAINTS_COMPANY_LOOKUP_ENABLED: "false" },
    });
    expect(r.companyName).toBeNull();
    expect(r.skippedReason).toBe("disabled");
  });

  it("returns api_no_phone_filter when flag on (v0.1 stub)", async () => {
    const r = await lookupCompanyFromFtcComplaints({
      phoneNumberNormalized: "+18155457907",
      env: { FTC_DNC_COMPLAINTS_COMPANY_LOOKUP_ENABLED: "true" },
    });
    expect(r.companyName).toBeNull();
    expect(r.skippedReason).toBe("api_no_phone_filter");
  });
});

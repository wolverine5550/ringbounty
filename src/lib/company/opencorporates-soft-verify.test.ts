import { describe, expect, it, vi } from "vitest";

import {
  USER_INPUT_UNVERIFIED,
  USER_INPUT_VERIFIED,
} from "@/lib/constants/company-name-verification";

import {
  softVerifyCompanyNameWithOpenCorporates,
  toOpenCorporatesJurisdictionCode,
} from "./opencorporates-soft-verify";

describe("toOpenCorporatesJurisdictionCode", () => {
  it("maps USPS codes to us_xx", () => {
    expect(toOpenCorporatesJurisdictionCode("CO")).toBe("us_co");
    expect(toOpenCorporatesJurisdictionCode(null)).toBeNull();
  });
});

describe("softVerifyCompanyNameWithOpenCorporates (§7.5.1b)", () => {
  it("returns unverified when API token missing", async () => {
    const r = await softVerifyCompanyNameWithOpenCorporates("Acme LLC", {
      apiToken: undefined,
      env: {},
    });
    expect(r.status).toBe(USER_INPUT_UNVERIFIED);
    expect(r.skippedReason).toBe("missing_token");
  });

  it("returns verified when search has companies", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          results: { companies: [{ company: { name: "Acme LLC" } }] },
        }),
    });

    const r = await softVerifyCompanyNameWithOpenCorporates("Acme LLC", {
      apiToken: "token",
      userStateCode: "CO",
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(r.status).toBe(USER_INPUT_VERIFIED);
    expect(r.skippedReason).toBeNull();
    const url = String(fetchImpl.mock.calls[0]?.[0]);
    expect(url).toContain("jurisdiction_code=us_co");
  });

  it("returns unverified when no results", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ results: { companies: [] } }),
    });

    const r = await softVerifyCompanyNameWithOpenCorporates("Fake Co", {
      apiToken: "token",
      fetchImpl: fetchImpl as typeof fetch,
    });
    expect(r.status).toBe(USER_INPUT_UNVERIFIED);
    expect(r.skippedReason).toBe("no_results");
  });
});

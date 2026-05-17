import { describe, expect, it, vi } from "vitest";

import {
  formatPhoneDigitsForWhitepages,
  lookupCompanyFromWhitepages,
} from "./whitepages-company-lookup";

describe("formatPhoneDigitsForWhitepages", () => {
  it("strips +1 to 10-digit NANP", () => {
    expect(formatPhoneDigitsForWhitepages("+12125550199")).toBe("2125550199");
    expect(formatPhoneDigitsForWhitepages("2125550199")).toBe("2125550199");
    expect(formatPhoneDigitsForWhitepages("+44")).toBeNull();
  });
});

describe("lookupCompanyFromWhitepages (§6.4.2)", () => {
  it("skips when disabled", async () => {
    const r = await lookupCompanyFromWhitepages("+12125550199", {
      enabled: false,
      apiKey: "test",
    });
    expect(r.skippedReason).toBe("disabled");
    expect(r.companyName).toBeNull();
  });

  it("skips when API key missing", async () => {
    const r = await lookupCompanyFromWhitepages("+12125550199", {
      enabled: true,
      apiKey: undefined,
    });
    expect(r.skippedReason).toBe("missing_credentials");
  });

  it("maps company_name from first person record", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          {
            id: "P1",
            name: "Jane Doe",
            company_name: "Acme Corp",
          },
        ]),
    });

    const r = await lookupCompanyFromWhitepages("+12125550199", {
      enabled: true,
      apiKey: "wp-key",
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(r.companyName).toBe("Acme Corp");
    expect(r.skippedReason).toBeNull();
    expect(fetchImpl).toHaveBeenCalledOnce();
    const url = String(fetchImpl.mock.calls[0]?.[0]);
    expect(url).toContain("phone=2125550199");
  });

  it("returns no_match when array empty", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([]),
    });

    const r = await lookupCompanyFromWhitepages("+12125550199", {
      enabled: true,
      apiKey: "wp-key",
      fetchImpl: fetchImpl as typeof fetch,
    });
    expect(r.skippedReason).toBe("no_match");
  });
});

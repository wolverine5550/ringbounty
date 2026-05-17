import { describe, expect, it, vi } from "vitest";

import { lookupRegisteredAgentViaOpenCorporates } from "./lookup-registered-agent-opencorporates";

describe("lookupRegisteredAgentViaOpenCorporates (§6.5)", () => {
  it("returns missing_token when no API token", async () => {
    const r = await lookupRegisteredAgentViaOpenCorporates({
      companyName: "Acme LLC",
      userStateCode: "CO",
      env: {},
    });
    expect(r.found).toBe(false);
    expect(r.skippedReason).toBe("missing_token");
  });

  it("finds registered agent after in-state search + company detail", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("/companies/search")) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              results: {
                companies: [
                  {
                    company: {
                      name: "Acme LLC",
                      jurisdiction_code: "us_co",
                      company_number: "999",
                    },
                  },
                ],
              },
            }),
        };
      }
      if (url.includes("/companies/us_co/999")) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              results: {
                company: {
                  officers: [
                    {
                      officer: {
                        id: 42,
                        name: "Corp Service Co",
                        position: "registered agent",
                        address: "123 Main St, Denver CO",
                        inactive: false,
                      },
                    },
                  ],
                },
              },
            }),
        };
      }
      return { ok: false, status: 404, text: async () => "{}" };
    });

    const r = await lookupRegisteredAgentViaOpenCorporates({
      companyName: "Acme LLC",
      userStateCode: "CO",
      apiToken: "token",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(r.found).toBe(true);
    expect(r.name).toBe("Corp Service Co");
    expect(r.address).toBe("123 Main St, Denver CO");
    expect(r.matchedJurisdiction).toBe("us_co");
  });

  it("falls back to Delaware when in-state search is empty", async () => {
    const jurisdictions: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      const parsed = new URL(url);
      const jc = parsed.searchParams.get("jurisdiction_code");
      if (jc) {
        jurisdictions.push(jc);
      }
      if (jc === "us_de") {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              results: {
                companies: [
                  {
                    company: {
                      name: "Acme LLC",
                      jurisdiction_code: "us_de",
                      company_number: "1",
                    },
                  },
                ],
              },
            }),
        };
      }
      if (url.includes("/companies/us_de/1")) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              results: {
                company: {
                  officers: [
                    {
                      officer: {
                        id: 7,
                        name: "Registered Agents Inc",
                        position: "agent",
                        inactive: false,
                      },
                    },
                  ],
                },
              },
            }),
        };
      }
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ results: { companies: [] } }),
      };
    });

    const r = await lookupRegisteredAgentViaOpenCorporates({
      companyName: "Acme LLC",
      userStateCode: "CO",
      apiToken: "token",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(jurisdictions[0]).toBe("us_co");
    expect(jurisdictions).toContain("us_de");
    expect(r.found).toBe(true);
    expect(r.name).toBe("Registered Agents Inc");
  });
});

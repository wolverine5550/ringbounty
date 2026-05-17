import { describe, expect, it } from "vitest";

import {
  isRegisteredAgentPosition,
  parseCompanyOfficers,
  parseCompanySearchResults,
  toOpenCorporatesJurisdictionCode,
} from "./opencorporates-api";

describe("toOpenCorporatesJurisdictionCode", () => {
  it("maps USPS codes", () => {
    expect(toOpenCorporatesJurisdictionCode("TX")).toBe("us_tx");
    expect(toOpenCorporatesJurisdictionCode(null)).toBeNull();
  });
});

describe("isRegisteredAgentPosition", () => {
  it("matches agent roles", () => {
    expect(isRegisteredAgentPosition("registered agent")).toBe(true);
    expect(isRegisteredAgentPosition("director")).toBe(false);
  });
});

describe("parseCompanySearchResults", () => {
  it("extracts company refs", () => {
    const refs = parseCompanySearchResults({
      results: {
        companies: [
          {
            company: {
              name: "Acme LLC",
              jurisdiction_code: "us_de",
              company_number: "123",
            },
          },
        ],
      },
    });
    expect(refs).toEqual([
      {
        name: "Acme LLC",
        jurisdictionCode: "us_de",
        companyNumber: "123",
      },
    ]);
  });
});

describe("parseCompanyOfficers", () => {
  it("parses embedded officers", () => {
    const officers = parseCompanyOfficers({
      results: {
        company: {
          officers: [
            {
              officer: {
                id: 1,
                name: "CT Corporation",
                position: "registered agent",
                inactive: false,
              },
            },
          ],
        },
      },
    });
    expect(officers[0]?.name).toBe("CT Corporation");
  });
});

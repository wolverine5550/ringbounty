import { describe, expect, it } from "vitest";

import {
  COMPANY_INTEL_API_OPENROUTER,
  COMPANY_INTEL_API_SERPAPI,
  computeCompanyIntelRunCost,
  DEFAULT_COMPANY_INTEL_OPENROUTER_COST_CENTS,
  DEFAULT_COMPANY_INTEL_SERPAPI_COST_CENTS,
  getOpenRouterCostCentsPerAttempt,
  getSerpapiCostCentsPerCall,
  isSerpapiBilled,
} from "./company-intel-run-cost";

describe("isSerpapiBilled (CI-4.3)", () => {
  it("bills on success and post-HTTP failures", () => {
    expect(isSerpapiBilled({ skippedReason: null } as never)).toBe(true);
    expect(
      isSerpapiBilled({ skippedReason: "http_error" } as never),
    ).toBe(true);
    expect(
      isSerpapiBilled({ skippedReason: "parse_error" } as never),
    ).toBe(true);
  });

  it("does not bill pre-HTTP skips", () => {
    expect(
      isSerpapiBilled({ skippedReason: "disabled" } as never),
    ).toBe(false);
    expect(
      isSerpapiBilled({ skippedReason: "missing_credentials" } as never),
    ).toBe(false);
    expect(
      isSerpapiBilled({ skippedReason: "invalid_phone" } as never),
    ).toBe(false);
  });
});

describe("computeCompanyIntelRunCost (CI-4.3.1)", () => {
  it("returns zero when no paid APIs invoked", () => {
    expect(
      computeCompanyIntelRunCost({
        serpapiBilled: false,
        openRouterHttpAttempts: 0,
      }),
    ).toEqual({ estimatedCostCents: 0, apisCalled: [] });
  });

  it("sums SerpAPI + OpenRouter with defaults", () => {
    expect(
      computeCompanyIntelRunCost({
        serpapiBilled: true,
        openRouterHttpAttempts: 2,
      }),
    ).toEqual({
      estimatedCostCents:
        DEFAULT_COMPANY_INTEL_SERPAPI_COST_CENTS +
        DEFAULT_COMPANY_INTEL_OPENROUTER_COST_CENTS * 2,
      apisCalled: [COMPANY_INTEL_API_SERPAPI, COMPANY_INTEL_API_OPENROUTER],
    });
  });

  it("respects env cost overrides", () => {
    expect(
      computeCompanyIntelRunCost(
        { serpapiBilled: true, openRouterHttpAttempts: 1 },
        {
          COMPANY_INTEL_SERPAPI_COST_CENTS: "2",
          COMPANY_INTEL_OPENROUTER_COST_CENTS: "10",
        },
      ),
    ).toEqual({
      estimatedCostCents: 12,
      apisCalled: [COMPANY_INTEL_API_SERPAPI, COMPANY_INTEL_API_OPENROUTER],
    });
    expect(getSerpapiCostCentsPerCall({ COMPANY_INTEL_SERPAPI_COST_CENTS: "2" })).toBe(
      2,
    );
    expect(
      getOpenRouterCostCentsPerAttempt({
        COMPANY_INTEL_OPENROUTER_COST_CENTS: "10",
      }),
    ).toBe(10);
  });
});

import { describe, expect, it, vi } from "vitest";

import {
  buildSynthesisUserPrompt,
  DEFAULT_COMPANY_INTEL_OPENROUTER_MODEL,
  getCompanyIntelOpenRouterModel,
  parseAndValidateSynthesisJson,
  synthesizeCompanyFromSources,
  synthesisResultToRound4Payload,
  SYNTHESIS_MAX_PARSE_ATTEMPTS,
} from "./synthesize-company-from-sources";
import type { IntelSourceHit } from "./types";

/** CI-4.2.4 — fixture sources[] + SerpAPI snippets for synthesis tests. */
const FIXTURE_SOURCES: IntelSourceHit[] = [
  { tier: "serpapi", companyName: null },
  { tier: "nomorobo", companyName: "CarShield" },
];

const FIXTURE_SERP_SNIPPETS = [
  {
    position: 1,
    title: "800notes — CarShield",
    link: "https://800notes.com/example",
    snippet: "Users report CarShield extended warranty robocalls from this number.",
  },
];

const VALID_MODEL_JSON = JSON.stringify({
  company_name: "CarShield Vehicle Protection",
  confidence: 78,
  reasoning:
    "Nomorobo and multiple complaint snippets name CarShield; sources agree on extended warranty telemarketing.",
  call_category: "telemarketer",
  callback_numbers: ["+18005559999"],
  is_spoofed_pool: false,
  contradictions: null,
});

describe("getCompanyIntelOpenRouterModel (CI-4.2.2)", () => {
  it("defaults to sonnet-class when env unset", () => {
    expect(getCompanyIntelOpenRouterModel({})).toBe(
      DEFAULT_COMPANY_INTEL_OPENROUTER_MODEL,
    );
  });

  it("uses COMPANY_INTEL_OPENROUTER_MODEL when set", () => {
    expect(
      getCompanyIntelOpenRouterModel({
        COMPANY_INTEL_OPENROUTER_MODEL: "openai/gpt-4o-mini",
      }),
    ).toBe("openai/gpt-4o-mini");
  });
});

describe("buildSynthesisUserPrompt (CI-4.2.4)", () => {
  it("includes fixture sources and serpapi snippets", () => {
    const prompt = buildSynthesisUserPrompt({
      phoneNumberNormalized: "+18005551234",
      sources: FIXTURE_SOURCES,
      serpapiSnippets: FIXTURE_SERP_SNIPPETS,
    });
    const parsed = JSON.parse(prompt) as {
      screened_number_display: string;
      sources: unknown[];
      serpapi_snippets: unknown[];
    };
    expect(parsed.screened_number_display).toBe("(800) 555-1234");
    expect(parsed.sources).toHaveLength(2);
    expect(parsed.serpapi_snippets).toHaveLength(1);
  });

  it("CI-5.1 includes complaint_site_comments in payload", () => {
    const prompt = buildSynthesisUserPrompt({
      phoneNumberNormalized: "+18005551234",
      sources: FIXTURE_SOURCES,
      complaintSiteComments: [
        {
          site: "800notes",
          url: "https://800notes.com/Phone.aspx/1-800-555-1234",
          text: "CarShield warranty robocall",
        },
      ],
    });
    const parsed = JSON.parse(prompt) as {
      complaint_site_comments: Array<{ site: string; text: string }>;
    };
    expect(parsed.complaint_site_comments).toHaveLength(1);
    expect(parsed.complaint_site_comments[0]?.site).toBe("800notes");
  });
});

describe("parseAndValidateSynthesisJson (CI-4.2.3)", () => {
  it("parses valid fixture JSON into SynthesisResult", () => {
    const result = parseAndValidateSynthesisJson(VALID_MODEL_JSON);
    expect(result).toMatchObject({
      companyName: "CarShield Vehicle Protection",
      confidence: 78,
      callCategory: "telemarketer",
      isSpoofedPool: false,
      callbackNumbers: ["+18005559999"],
    });
  });

  it("rejects Unknown company_name and invalid confidence", () => {
    expect(
      parseAndValidateSynthesisJson(
        JSON.stringify({
          company_name: "Unknown",
          confidence: 150,
          reasoning: "weak",
          call_category: null,
          callback_numbers: [],
          is_spoofed_pool: false,
          contradictions: null,
        }),
      ),
    ).toMatchObject({
      companyName: null,
      confidence: 100,
    });

    expect(parseAndValidateSynthesisJson("{not-json")).toBeNull();
    expect(
      parseAndValidateSynthesisJson(
        JSON.stringify({
          company_name: "Acme",
          confidence: 50,
          reasoning: "",
          call_category: null,
          callback_numbers: [],
          is_spoofed_pool: false,
          contradictions: null,
        }),
      ),
    ).toBeNull();
  });
});

describe("synthesizeCompanyFromSources (CI-4.2.4)", () => {
  it("skips when OPENROUTER_API_KEY missing", async () => {
    const fetchImpl = vi.fn();
    const result = await synthesizeCompanyFromSources(
      {
        phoneNumberNormalized: "+18005551234",
        sources: FIXTURE_SOURCES,
        serpapiSnippets: FIXTURE_SERP_SNIPPETS,
      },
      { apiKey: undefined, fetchImpl },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.skippedReason).toBe("missing_credentials");
      expect(result.httpAttempts).toBe(0);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("skips when no sources or snippets", async () => {
    const result = await synthesizeCompanyFromSources(
      {
        phoneNumberNormalized: "+18005551234",
        sources: [],
      },
      { apiKey: "test-key" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.skippedReason).toBe("insufficient_context");
    }
  });

  it("retries once on malformed JSON then succeeds (CI-4.2.3)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "not valid json {" } }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: VALID_MODEL_JSON } }],
        }),
      });

    const result = await synthesizeCompanyFromSources(
      {
        phoneNumberNormalized: "+18005551234",
        sources: FIXTURE_SOURCES,
        serpapiSnippets: FIXTURE_SERP_SNIPPETS,
      },
      {
        apiKey: "test-key",
        model: "anthropic/claude-sonnet-4",
        fetchImpl,
      },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(SYNTHESIS_MAX_PARSE_ATTEMPTS);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.synthesis.companyName).toBe("CarShield Vehicle Protection");
      expect(result.response).toBe(VALID_MODEL_JSON);
      expect(result.httpAttempts).toBe(SYNTHESIS_MAX_PARSE_ATTEMPTS);
    }
  });

  it("calls OpenRouter with json_object response_format", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: VALID_MODEL_JSON } }],
      }),
    });

    await synthesizeCompanyFromSources(
      {
        phoneNumberNormalized: "+18005551234",
        sources: FIXTURE_SOURCES,
        serpapiSnippets: FIXTURE_SERP_SNIPPETS,
      },
      { apiKey: "test-key", fetchImpl },
    );

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as {
      model: string;
      response_format: { type: string };
    };
    expect(body.model).toBe("anthropic/claude-sonnet-4");
    expect(body.response_format).toEqual({ type: "json_object" });
  });
});

describe("synthesisResultToRound4Payload (CI-4.2.1)", () => {
  it("maps success to openrouter_synthesis hit", () => {
    const synthesis = parseAndValidateSynthesisJson(VALID_MODEL_JSON)!;
    const payload = synthesisResultToRound4Payload({
      ok: true,
      synthesis,
      prompt: "system\n\n---\n\n{}",
      response: VALID_MODEL_JSON,
      httpAttempts: 1,
    });
    expect(payload.hit.tier).toBe("openrouter_synthesis");
    expect(payload.hit.companyName).toBe("CarShield Vehicle Protection");
    expect(payload.rawResultsSlice.openrouter).toBeDefined();
  });
});

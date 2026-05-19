import { describe, expect, it, vi } from "vitest";

import {
  buildSerpapiComplaintSearchQuery,
  redactPhonePiiForLog,
  searchComplaintSnippetsViaSerpapi,
  serpapiResultToRound3Payload,
  SERPAPI_COMPLAINT_SEARCH_NUM,
} from "./serpapi-complaint-search";

describe("buildSerpapiComplaintSearchQuery (CI-4.1.2)", () => {
  it("builds quoted NANP display + complaint keywords", () => {
    expect(buildSerpapiComplaintSearchQuery("+18005551234")).toBe(
      '"(800) 555-1234" robocall OR spam OR complaint OR "who called"',
    );
  });

  it("returns null for non-US numbers", () => {
    expect(buildSerpapiComplaintSearchQuery("+442079460958")).toBeNull();
  });
});

describe("redactPhonePiiForLog (CI-4.1.3)", () => {
  it("redacts E.164 and display formats", () => {
    const raw =
      "query (800) 555-1234 and +18005551234 failed for 800-555-1234";
    expect(redactPhonePiiForLog(raw)).not.toContain("800");
    expect(redactPhonePiiForLog(raw)).toContain("[PHONE_REDACTED]");
  });
});

describe("searchComplaintSnippetsViaSerpapi (CI-4.1.4)", () => {
  it("skips when disabled", async () => {
    const fetchImpl = vi.fn();
    const result = await searchComplaintSnippetsViaSerpapi("+18005551234", {
      enabled: false,
      apiKey: "key",
      fetchImpl,
    });
    expect(result.skippedReason).toBe("disabled");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("skips when api key missing", async () => {
    const fetchImpl = vi.fn();
    const result = await searchComplaintSnippetsViaSerpapi("+18005551234", {
      enabled: true,
      apiKey: undefined,
      fetchImpl,
    });
    expect(result.skippedReason).toBe("missing_credentials");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("calls SerpAPI with num=10 and parses organic snippets", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        organic_results: [
          {
            position: 1,
            title: "800notes — CarShield robocall",
            link: "https://800notes.com/Phone.aspx/1-800-555-1234",
            snippet: "Users report CarShield extended warranty spam.",
          },
        ],
      }),
    });

    const result = await searchComplaintSnippetsViaSerpapi("+18005551234", {
      enabled: true,
      apiKey: "test-serp-key",
      fetchImpl,
    });

    expect(result.skippedReason).toBeNull();
    expect(result.snippets).toHaveLength(1);
    expect(result.snippets[0]?.title).toContain("CarShield");
    expect(result.raw).toMatchObject({
      result_count: 1,
      snippets: expect.any(Array),
    });
    expect(result.raw).not.toHaveProperty("api_key");

    const calledUrl = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(calledUrl.hostname).toBe("serpapi.com");
    expect(calledUrl.pathname).toBe("/search.json");
    expect(calledUrl.searchParams.get("engine")).toBe("google");
    expect(calledUrl.searchParams.get("num")).toBe(String(SERPAPI_COMPLAINT_SEARCH_NUM));
    expect(calledUrl.searchParams.get("api_key")).toBe("test-serp-key");
    expect(calledUrl.searchParams.get("q")).toBe(
      '"(800) 555-1234" robocall OR spam OR complaint OR "who called"',
    );
  });

  it("returns http_error on non-OK response without logging phone in result", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    });

    const result = await searchComplaintSnippetsViaSerpapi("+18005551234", {
      enabled: true,
      apiKey: "test-serp-key",
      fetchImpl,
    });

    expect(result.skippedReason).toBe("http_error");
    expect(result.httpStatus).toBe(429);
    expect(result.raw).not.toHaveProperty("api_key");
  });
});

describe("serpapiResultToRound3Payload (CI-4.1.3)", () => {
  it("maps success to serpapi tier hit and raw slice", () => {
    const payload = serpapiResultToRound3Payload({
      query: '"test" robocall',
      snippets: [{ position: 1, title: "t", link: "https://x", snippet: "s" }],
      skippedReason: null,
      raw: { snippets: [], result_count: 1 },
    });
    expect(payload.hits).toEqual([{ tier: "serpapi", companyName: null }]);
    expect(payload.auditSkippedReason).toBeNull();
    expect(payload.rawResultsSlice.serpapi).toBeDefined();
  });

  it("maps skip to audit reason", () => {
    const payload = serpapiResultToRound3Payload({
      query: null,
      snippets: [],
      skippedReason: "disabled",
      raw: { skipped: true, reason: "disabled" },
    });
    expect(payload.hits).toEqual([]);
    expect(payload.auditSkippedReason).toBe("serpapi_disabled");
  });
});

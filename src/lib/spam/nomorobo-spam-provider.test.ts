import { describe, expect, it, vi } from "vitest";

import {
  createNomoroboSpamCheckProvider,
  createNomoroboSpamCheckProviderFromEnv,
  extractRiskScoreFromNomoroboCheck,
  formatPhoneDigitsForNomorobo,
  mapNomoroboCheckJsonToSpamCheckResult,
  NOMOROBO_API_KEY_ENV_KEY,
  NOMOROBO_SPAM_THRESHOLD,
  normalizeNomoroboReportedCategory,
} from "./nomorobo-spam-provider";

const sampleRobocallBody = {
  version: "1",
  phone_number: "18009556600",
  phone_number_reputation_details: {
    number_of_calls: 844,
    last_call: "2025-04-15T15:29:51.000000Z",
    stir_shaken: "C",
    reported_name: "Capital One",
    reported_category: "Robocall",
    block_status: "blocked",
    risk_score: 90,
    violations: ["internal", "spam"],
  },
} as const;

const sampleSafeBody = {
  ...sampleRobocallBody,
  phone_number_reputation_details: {
    ...sampleRobocallBody.phone_number_reputation_details,
    risk_score: 15,
    number_of_calls: 2,
    reported_category: "Unknown",
    block_status: "allowed",
  },
} as const;

describe("formatPhoneDigitsForNomorobo", () => {
  it("normalizes E.164 US to 11-digit From", () => {
    expect(formatPhoneDigitsForNomorobo("+15551234567")).toBe("15551234567");
    expect(formatPhoneDigitsForNomorobo("5551234567")).toBe("15551234567");
  });
});

describe("normalizeNomoroboReportedCategory", () => {
  it("maps Robocall to robocall slug", () => {
    expect(normalizeNomoroboReportedCategory("Robocall")).toBe("robocall");
  });
});

describe("mapNomoroboCheckJsonToSpamCheckResult", () => {
  it("maps high risk_score to isSpam per threshold", () => {
    const r = mapNomoroboCheckJsonToSpamCheckResult(sampleRobocallBody);
    expect(r.providerId).toBe("nomorobo");
    expect(r.isSpam).toBe(true);
    expect(r.score).toBe(90);
    expect(r.complaints).toBe(844);
    expect(r.companyName).toBe("Capital One");
    expect(r.category).toBe("robocall");
  });

  it("sets isSpam false below threshold", () => {
    const r = mapNomoroboCheckJsonToSpamCheckResult(sampleSafeBody);
    expect(r.isSpam).toBe(false);
    expect(r.score).toBe(15);
  });

  it("respects custom threshold", () => {
    const r = mapNomoroboCheckJsonToSpamCheckResult(sampleSafeBody, {
      qualitySpamThreshold: 10,
    });
    expect(r.isSpam).toBe(true);
  });
});

describe("createNomoroboSpamCheckProvider", () => {
  it("returns skipped when disabled", async () => {
    const p = createNomoroboSpamCheckProvider({
      enabled: false,
      apiKey: "key",
    });
    const r = await p.check("+15551234567");
    expect(r.raw).toEqual({ skipped: true, reason: "disabled" });
  });

  it("returns skipped when API key missing", async () => {
    const p = createNomoroboSpamCheckProvider({
      enabled: true,
      apiKey: "",
    });
    const r = await p.check("+15551234567");
    expect(r.raw).toEqual({ skipped: true, reason: "missing_credentials" });
  });

  it("calls Nomorobo /v2/check with From and X-API-Key", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify(sampleRobocallBody), { status: 200 });
    });
    const p = createNomoroboSpamCheckProvider({
      enabled: true,
      apiKey: "test-key",
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    const r = await p.check("+18009556600");
    expect(r.isSpam).toBe(true);
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [url, init] = firstCall as unknown as [string, RequestInit];
    expect(String(url)).toContain("api.nomorobo.com/v2/check");
    expect(String(url)).toContain("From=18009556600");
    const headers = init?.headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBe("test-key");
  });

  it("includes To when recipientPhoneE164 is set", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify(sampleSafeBody), { status: 200 });
    });
    const p = createNomoroboSpamCheckProvider({
      enabled: true,
      apiKey: "k",
      recipientPhoneE164: "+15714631055",
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await p.check("+18009556600");
    const [url] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toContain("To=15714631055");
  });

  it("throws on HTTP error", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('{"error":"unauthorized"}', { status: 401 });
    });
    const p = createNomoroboSpamCheckProvider({
      enabled: true,
      apiKey: "bad",
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await expect(p.check("+15551234567")).rejects.toThrow(/401/);
  });
});

describe("createNomoroboSpamCheckProviderFromEnv", () => {
  it("reads NOMOROBO_API_KEY from env", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify(sampleSafeBody), { status: 200 });
    });
    const p = createNomoroboSpamCheckProviderFromEnv(
      { [NOMOROBO_API_KEY_ENV_KEY]: "env-key" },
      true,
      fetchMock as unknown as typeof fetch,
    );
    await p.check("+15551234567");
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init?.headers as Record<string, string>)["X-API-Key"]).toBe(
      "env-key",
    );
    expect(NOMOROBO_SPAM_THRESHOLD).toBe(80);
    expect(extractRiskScoreFromNomoroboCheck(sampleRobocallBody)).toBe(90);
  });
});

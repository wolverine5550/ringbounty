import { describe, expect, it, vi } from "vitest";

import {
  createTwilioSpamCheckProvider,
  createTwilioSpamCheckProviderFromEnv,
  extractCallerNameFromTwilioLookupV2,
  extractQualityScoreFromTwilioLookupV2,
  mapTwilioLookupV2JsonToSpamCheckResult,
  TWILIO_ACCOUNT_SID_ENV_KEY,
  TWILIO_AUTH_TOKEN_ENV_KEY,
  TWILIO_LOOKUP_V2_FIELDS,
  TWILIO_QUALITY_SPAM_THRESHOLD,
} from "./twilio-lookup-spam-provider";

const sampleLookupBodyHighRisk = {
  calling_country_code: "1",
  country_code: "US",
  phone_number: "+19892008374",
  national_format: "(989) 200-8374",
  valid: true,
  validation_errors: [],
  caller_name: {
    caller_name: "ACME TELEMARKETER",
    caller_type: "BUSINESS",
    error_code: null,
  },
  line_type_intelligence: {
    mobile_country_code: "310",
    mobile_network_code: null,
    carrier_name: "Ytel/Blitz",
    type: "mobile",
    error_code: null,
  },
  phone_number_quality_score: {
    quality_score: 92,
    error_code: null,
  },
  url: "https://lookups.twilio.com/v2/PhoneNumbers/+19892008374",
} as const;

const sampleLookupBodyLowRisk = {
  ...sampleLookupBodyHighRisk,
  phone_number_quality_score: {
    quality_score: 25,
    error_code: null,
  },
} as const;

const sampleLookupBodyNoQualityPackage = {
  ...sampleLookupBodyHighRisk,
  phone_number_quality_score: null,
} as const;

describe("extractQualityScoreFromTwilioLookupV2", () => {
  it("returns null when package is null or not an object", () => {
    expect(extractQualityScoreFromTwilioLookupV2(null)).toBe(null);
    expect(extractQualityScoreFromTwilioLookupV2("x")).toBe(null);
  });

  it("reads quality_score and alternate keys", () => {
    expect(
      extractQualityScoreFromTwilioLookupV2({ quality_score: 92 }),
    ).toBe(92);
    expect(extractQualityScoreFromTwilioLookupV2({ score: 50 })).toBe(50);
  });
});

describe("extractCallerNameFromTwilioLookupV2", () => {
  it("reads nested caller_name.caller_name", () => {
    expect(
      extractCallerNameFromTwilioLookupV2({
        caller_name: "ACME",
        caller_type: "BUSINESS",
      }),
    ).toBe("ACME");
  });
});

describe("mapTwilioLookupV2JsonToSpamCheckResult", () => {
  it("sets isSpam when quality score meets threshold (PRD §8 >80)", () => {
    const r = mapTwilioLookupV2JsonToSpamCheckResult(sampleLookupBodyHighRisk);
    expect(r.providerId).toBe("twilio");
    expect(r.isSpam).toBe(true);
    expect(r.score).toBe(92);
    expect(r.companyName).toBe("ACME TELEMARKETER");
    expect(r.category).toBe("mobile");
    expect(r.complaints).toBe(null);
    expect(r.raw).toEqual(sampleLookupBodyHighRisk);
  });

  it("sets isSpam false when score is below threshold", () => {
    const r = mapTwilioLookupV2JsonToSpamCheckResult(sampleLookupBodyLowRisk);
    expect(r.isSpam).toBe(false);
    expect(r.score).toBe(25);
  });

  it("treats missing quality package as not spam", () => {
    const r = mapTwilioLookupV2JsonToSpamCheckResult(
      sampleLookupBodyNoQualityPackage,
    );
    expect(r.isSpam).toBe(false);
    expect(r.score).toBe(null);
  });

  it("respects custom qualitySpamThreshold", () => {
    const r = mapTwilioLookupV2JsonToSpamCheckResult(sampleLookupBodyLowRisk, {
      qualitySpamThreshold: 20,
    });
    expect(r.isSpam).toBe(true);
  });
});

describe("createTwilioSpamCheckProvider", () => {
  it("returns skipped when disabled (§5.2.4)", async () => {
    const p = createTwilioSpamCheckProvider({
      enabled: false,
      accountSid: "ACxxx",
      authToken: "yyy",
    });
    const r = await p.check("+15551234567");
    expect(r).toMatchObject({
      isSpam: false,
      raw: { skipped: true, reason: "disabled" },
      providerId: "twilio",
    });
  });

  it("returns skipped when credentials missing (§5.2.4)", async () => {
    const p = createTwilioSpamCheckProvider({
      enabled: true,
      accountSid: "",
      authToken: "",
    });
    const r = await p.check("+15551234567");
    expect(r.raw).toEqual({ skipped: true, reason: "missing_credentials" });
  });

  it("calls Twilio v2 URL with Fields and maps 200 JSON", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify(sampleLookupBodyHighRisk), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const p = createTwilioSpamCheckProvider({
      enabled: true,
      accountSid: "ACtest",
      authToken: "secret",
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    const r = await p.check("+19892008374");
    expect(r.isSpam).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [calledUrl, init] = firstCall as unknown as [string, RequestInit];

    expect(String(calledUrl)).toContain("lookups.twilio.com/v2/PhoneNumbers");
    expect(String(calledUrl)).toMatch(/PhoneNumbers\/%2B19892008374/);
    expect(String(calledUrl)).toContain(
      `Fields=${encodeURIComponent(TWILIO_LOOKUP_V2_FIELDS)}`,
    );
    const headers = init?.headers;
    const auth =
      headers instanceof Headers
        ? headers.get("Authorization")
        : (headers as Record<string, string> | undefined)?.Authorization;
    expect(auth).toMatch(/^Basic /);
  });

  it("throws on HTTP error", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('{"code":20003,"message":"Authenticate"}', {
        status: 401,
      });
    });
    const p = createTwilioSpamCheckProvider({
      enabled: true,
      accountSid: "ACx",
      authToken: "bad",
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await expect(p.check("+15550001111")).rejects.toThrow(/401/);
  });

  it("throws when body is not JSON", async () => {
    const fetchMock = vi.fn(async () => new Response("not json", { status: 200 }));
    const p = createTwilioSpamCheckProvider({
      enabled: true,
      accountSid: "ACx",
      authToken: "tok",
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    await expect(p.check("+15550001111")).rejects.toThrow(/non-JSON/);
  });
});

describe("createTwilioSpamCheckProviderFromEnv", () => {
  it("reads sid and token from env keys", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify(sampleLookupBodyLowRisk), {
        status: 200,
      });
    });
    const p = createTwilioSpamCheckProviderFromEnv(
      {
        [TWILIO_ACCOUNT_SID_ENV_KEY]: "ACfromenv",
        [TWILIO_AUTH_TOKEN_ENV_KEY]: "tokfromenv",
      },
      true,
      fetchMock as unknown as typeof fetch,
    );
    const r = await p.check("+19892008374");
    expect(r.isSpam).toBe(false);
    expect(TWILIO_QUALITY_SPAM_THRESHOLD).toBe(80);
    const envCall = fetchMock.mock.calls[0];
    expect(envCall).toBeDefined();
    const [, init] = envCall as unknown as [string, RequestInit];
    const auth = (init?.headers as Record<string, string>)?.Authorization;
    expect(auth).toBe(
      "Basic " + Buffer.from("ACfromenv:tokfromenv", "utf8").toString("base64"),
    );
  });
});

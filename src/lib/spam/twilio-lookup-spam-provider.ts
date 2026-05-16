/**
 * Phase 5.2 — Twilio **Lookup API v2** adapter (secondary corroboration + phone metadata).
 *
 * Uses paid data packages on `GET https://lookups.twilio.com/v2/PhoneNumbers/{E.164}` per
 * [Lookup v2](https://www.twilio.com/docs/lookup/v2-api) and PRD §7 (Nomorobo primary + Twilio).
 */

import type { SpamCheckProvider, SpamCheckResult } from "./types";

/** Twilio Console → “live” credentials; used as HTTP Basic username. */
export const TWILIO_ACCOUNT_SID_ENV_KEY = "TWILIO_ACCOUNT_SID" as const;
/** Twilio Console auth token; used as HTTP Basic password. Kept server-only. */
export const TWILIO_AUTH_TOKEN_ENV_KEY = "TWILIO_AUTH_TOKEN" as const;

/** Comma-separated `Fields` requested on every lookup (PRD §7). */
export const TWILIO_LOOKUP_V2_FIELDS =
  "phone_number_quality_score,caller_name,line_type_intelligence" as const;

const TWILIO_LOOKUP_V2_BASE = "https://lookups.twilio.com/v2/PhoneNumbers";

const PROVIDER_ID = "twilio";

/** Default HTTP timeout per task_manager §5.2.1. */
export const DEFAULT_TWILIO_LOOKUP_TIMEOUT_MS = 5_000;

/**
 * `isSpam` when {@link extractQualityScoreFromTwilioLookupV2} is ≥ this value (0–100).
 * Aligns with PRD §8 “high confidence (>80)” for spam-database points.
 */
export const TWILIO_QUALITY_SPAM_THRESHOLD = 80;

export type TwilioSpamProviderEnv = Record<string, string | undefined>;

export type TwilioSpamCheckProviderOptions = {
  /** When false, {@link SpamCheckProvider.check} never calls the network (§5.2.4). */
  enabled: boolean;
  accountSid: string | undefined;
  authToken: string | undefined;
  /**
   * Abort timeout in ms (defaults to {@link DEFAULT_TWILIO_LOOKUP_TIMEOUT_MS}).
   * Passed to `fetch` via `AbortSignal.timeout` when available, else `AbortController` + timer.
   */
  timeoutMs?: number;
  /** Override spam threshold (defaults to {@link TWILIO_QUALITY_SPAM_THRESHOLD}). */
  qualitySpamThreshold?: number;
  /** Injected for tests; defaults to global `fetch`. */
  fetchImpl?: typeof fetch;
};

function skippedResult(reason: "disabled" | "missing_credentials"): SpamCheckResult {
  return {
    isSpam: false,
    score: null,
    complaints: null,
    category: null,
    companyName: null,
    raw: { skipped: true, reason },
    providerId: PROVIDER_ID,
  };
}

function basicAuthHeader(accountSid: string, authToken: string): string {
  const pair = `${accountSid}:${authToken}`;
  if (typeof Buffer !== "undefined") {
    return `Basic ${Buffer.from(pair, "utf8").toString("base64")}`;
  }
  return `Basic ${btoa(pair)}`;
}

/**
 * Builds `Authorization` for Twilio ([HTTP Basic](https://www.twilio.com/docs/usage/requests-to-twilio)).
 */
export function twilioBasicAuthHeader(accountSid: string, authToken: string): string {
  return basicAuthHeader(accountSid, authToken);
}

/** JSON shape for Twilio Lookup v2 (subset used for mapping). */
export type TwilioLookupV2PhonePayload = {
  valid?: boolean;
  caller_name?:
    | {
        caller_name?: string | null;
        caller_type?: string | null;
        error_code?: number | null;
      }
    | string
    | null;
  line_type_intelligence?: {
    carrier_name?: string | null;
    type?: string | null;
    error_code?: string | number | null;
  } | null;
  phone_number_quality_score?: Record<string, unknown> | null;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Reads a 0–100-style risk score from `phone_number_quality_score` when Twilio returns the package.
 * Tries common property names; returns `null` if the package is absent or has no numeric score.
 */
export function extractQualityScoreFromTwilioLookupV2(
  qualityBlock: unknown,
): number | null {
  if (!isRecord(qualityBlock)) {
    return null;
  }
  for (const key of [
    "quality_score",
    "phone_number_quality_score",
    "score",
    "risk_score",
  ]) {
    const n = parseFiniteNumber(qualityBlock[key]);
    if (n !== null) {
      return n;
    }
  }
  return null;
}

/** Resolves CNAM display name from v2 `caller_name` object (or string if present). */
export function extractCallerNameFromTwilioLookupV2(
  callerNameField: TwilioLookupV2PhonePayload["caller_name"] | undefined,
): string | null {
  if (typeof callerNameField === "string" && callerNameField.trim() !== "") {
    return callerNameField;
  }
  if (isRecord(callerNameField)) {
    const name = callerNameField["caller_name"];
    if (typeof name === "string" && name.trim() !== "") {
      return name;
    }
  }
  return null;
}

/**
 * Maps a parsed Lookup v2 JSON body into {@link SpamCheckResult}. Full body is kept in `raw` for §5.2.2 / `claim_events`.
 */
export function mapTwilioLookupV2JsonToSpamCheckResult(
  body: TwilioLookupV2PhonePayload,
  options: { qualitySpamThreshold?: number } = {},
): SpamCheckResult {
  const threshold =
    options.qualitySpamThreshold ?? TWILIO_QUALITY_SPAM_THRESHOLD;
  const score = extractQualityScoreFromTwilioLookupV2(
    body.phone_number_quality_score,
  );
  const isSpam = score !== null && score >= threshold;
  const category =
    typeof body.line_type_intelligence?.type === "string" &&
    body.line_type_intelligence.type.trim() !== ""
      ? body.line_type_intelligence.type
      : null;
  const companyName = extractCallerNameFromTwilioLookupV2(body.caller_name);

  return {
    isSpam,
    score,
    complaints: null,
    category,
    companyName,
    raw: body,
    providerId: PROVIDER_ID,
  };
}

function lookupUrlForE164(phoneE164: string): string {
  const pathPhone = encodeURIComponent(phoneE164);
  const params = new URLSearchParams({
    Fields: TWILIO_LOOKUP_V2_FIELDS,
  });
  return `${TWILIO_LOOKUP_V2_BASE}/${pathPhone}?${params.toString()}`;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  fetchImpl: typeof fetch,
): Promise<Response> {
  try {
    const signal =
      typeof AbortSignal !== "undefined" &&
      typeof AbortSignal.timeout === "function"
        ? AbortSignal.timeout(timeoutMs)
        : undefined;
    if (signal) {
      return await fetchImpl(url, { ...init, signal });
    }
  } catch {
    /* fall through — older runtimes without AbortSignal.timeout */
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Factory: returns a {@link SpamCheckProvider} that calls Twilio Lookup v2.
 * Does not perform orchestration (§5.4) or persistence — only HTTP + mapping.
 */
export function createTwilioSpamCheckProvider(
  options: TwilioSpamCheckProviderOptions,
): SpamCheckProvider {
  const {
    enabled,
    accountSid,
    authToken,
    timeoutMs = DEFAULT_TWILIO_LOOKUP_TIMEOUT_MS,
    qualitySpamThreshold = TWILIO_QUALITY_SPAM_THRESHOLD,
    fetchImpl = fetch,
  } = options;

  return {
    async check(phone: string): Promise<SpamCheckResult> {
      if (!enabled) {
        return skippedResult("disabled");
      }
      const sid = accountSid?.trim();
      const token = authToken?.trim();
      if (!sid || !token) {
        return skippedResult("missing_credentials");
      }

      const url = lookupUrlForE164(phone);
      const res = await fetchWithTimeout(
        url,
        {
          method: "GET",
          headers: {
            Authorization: basicAuthHeader(sid, token),
            Accept: "application/json",
          },
        },
        timeoutMs,
        fetchImpl,
      );

      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          `Twilio Lookup returned non-JSON (status ${res.status})`,
        );
      }

      if (!res.ok) {
        const err = new Error(
          `Twilio Lookup HTTP ${res.status}: ${text.slice(0, 200)}`,
        );
        (err as Error & { status?: number }).status = res.status;
        throw err;
      }

      if (!isRecord(parsed)) {
        throw new Error("Twilio Lookup JSON root must be an object");
      }

      return mapTwilioLookupV2JsonToSpamCheckResult(
        parsed as TwilioLookupV2PhonePayload,
        { qualitySpamThreshold },
      );
    },
  };
}

/**
 * Convenience: reads {@link TWILIO_ACCOUNT_SID_ENV_KEY}, {@link TWILIO_AUTH_TOKEN_ENV_KEY}, and `enabled`
 * from the passed env bag (defaults to `process.env`).
 */
export function createTwilioSpamCheckProviderFromEnv(
  env: TwilioSpamProviderEnv = process.env,
  enabled: boolean,
  fetchImpl?: typeof fetch,
): SpamCheckProvider {
  return createTwilioSpamCheckProvider({
    enabled,
    accountSid: env[TWILIO_ACCOUNT_SID_ENV_KEY],
    authToken: env[TWILIO_AUTH_TOKEN_ENV_KEY],
    fetchImpl,
  });
}

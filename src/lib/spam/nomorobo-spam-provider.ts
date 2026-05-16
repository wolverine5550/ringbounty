/**
 * Phase 5.3 — **Nomorobo Enterprise API** (primary spam / robocall reputation).
 *
 * @see docs/Nomorobo Enterprise API Documentation.pdf — `GET /v2/check`
 * @see https://www.nomorobo.com/api/
 */

import type { SpamCheckProvider, SpamCheckResult } from "./types";

/** Dashboard API token; sent as `X-API-Key` (server-only). */
export const NOMOROBO_API_KEY_ENV_KEY = "NOMOROBO_API_KEY" as const;

const NOMOROBO_API_V2_BASE = "https://api.nomorobo.com/v2";

const PROVIDER_ID = "nomorobo";

/** Default HTTP timeout (task_manager §5.3). */
export const DEFAULT_NOMOROBO_LOOKUP_TIMEOUT_MS = 5_000;

/**
 * `isSpam` when {@link extractRiskScoreFromNomoroboCheck} is ≥ this value (1–100).
 * Aligns with PRD §8 high-confidence band and Twilio quality threshold.
 */
export const NOMOROBO_SPAM_THRESHOLD = 80;

export type NomoroboSpamProviderEnv = Record<string, string | undefined>;

export type NomoroboSpamCheckProviderOptions = {
  enabled: boolean;
  apiKey: string | undefined;
  /** Optional callee E.164 for neighbor-spoof context (`To` query param). */
  recipientPhoneE164?: string | null;
  timeoutMs?: number;
  qualitySpamThreshold?: number;
  fetchImpl?: typeof fetch;
};

/** Subset of Nomorobo `GET /check` JSON used for mapping. */
export type NomoroboCheckResponse = {
  version?: string;
  phone_number?: string;
  phone_number_reputation_details?: {
    number_of_calls?: number | null;
    risk_score?: number | null;
    reported_name?: string | null;
    reported_category?: string | null;
    block_status?: string | null;
    violations?: readonly string[] | null;
    [key: string]: unknown;
  } | null;
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
 * Nomorobo expects numeric `From` / `To` without `+` (e.g. `15551234567` or `18009556600`).
 */
export function formatPhoneDigitsForNomorobo(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits;
  }
  if (digits.length === 10) {
    return `1${digits}`;
  }
  return digits;
}

/** Reads `risk_score` from a `/check` response body. */
export function extractRiskScoreFromNomoroboCheck(
  body: NomoroboCheckResponse,
): number | null {
  return parseFiniteNumber(body.phone_number_reputation_details?.risk_score);
}

/**
 * Maps Nomorobo `reported_category` (e.g. `Robocall`) toward PRD `call_category` slugs.
 */
export function normalizeNomoroboReportedCategory(
  reported: string | null | undefined,
): string | null {
  if (typeof reported !== "string" || reported.trim() === "") {
    return null;
  }
  const lower = reported.trim().toLowerCase();
  if (lower === "robocall" || lower === "telemarketer" || lower === "scammer") {
    return lower;
  }
  if (lower.includes("robo")) {
    return "robocall";
  }
  if (lower.includes("telemarket")) {
    return "telemarketer";
  }
  if (lower.includes("scam")) {
    return "scammer";
  }
  return lower.replace(/\s+/g, "_");
}

/**
 * Maps Nomorobo `GET /check` JSON into {@link SpamCheckResult}; full body kept in `raw`.
 */
export function mapNomoroboCheckJsonToSpamCheckResult(
  body: NomoroboCheckResponse,
  options: { qualitySpamThreshold?: number } = {},
): SpamCheckResult {
  const threshold =
    options.qualitySpamThreshold ?? NOMOROBO_SPAM_THRESHOLD;
  const details = body.phone_number_reputation_details;
  const score = extractRiskScoreFromNomoroboCheck(body);
  const isSpam = score !== null && score >= threshold;
  const complaints = parseFiniteNumber(details?.number_of_calls);
  const category = normalizeNomoroboReportedCategory(details?.reported_category);
  const companyName =
    typeof details?.reported_name === "string" &&
    details.reported_name.trim() !== ""
      ? details.reported_name.trim()
      : null;

  return {
    isSpam,
    score,
    complaints: complaints !== null ? Math.trunc(complaints) : null,
    category,
    companyName,
    raw: body,
    providerId: PROVIDER_ID,
  };
}

function checkUrl(fromDigits: string, toDigits: string | null): string {
  const params = new URLSearchParams({ From: fromDigits });
  if (toDigits) {
    params.set("To", toDigits);
  }
  return `${NOMOROBO_API_V2_BASE}/check?${params.toString()}`;
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
    /* older runtimes */
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
 * Factory: Nomorobo Enterprise `GET /v2/check` → {@link SpamCheckProvider}.
 */
export function createNomoroboSpamCheckProvider(
  options: NomoroboSpamCheckProviderOptions,
): SpamCheckProvider {
  const {
    enabled,
    apiKey,
    recipientPhoneE164 = null,
    timeoutMs = DEFAULT_NOMOROBO_LOOKUP_TIMEOUT_MS,
    qualitySpamThreshold = NOMOROBO_SPAM_THRESHOLD,
    fetchImpl = fetch,
  } = options;

  return {
    async check(phone: string): Promise<SpamCheckResult> {
      if (!enabled) {
        return skippedResult("disabled");
      }
      const key = apiKey?.trim();
      if (!key) {
        return skippedResult("missing_credentials");
      }

      const fromDigits = formatPhoneDigitsForNomorobo(phone);
      const toDigits = recipientPhoneE164
        ? formatPhoneDigitsForNomorobo(recipientPhoneE164)
        : null;
      const url = checkUrl(fromDigits, toDigits);

      const res = await fetchWithTimeout(
        url,
        {
          method: "GET",
          headers: {
            "X-API-Key": key,
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
          `Nomorobo API returned non-JSON (status ${res.status})`,
        );
      }

      if (!res.ok) {
        const err = new Error(
          `Nomorobo API HTTP ${res.status}: ${text.slice(0, 200)}`,
        );
        (err as Error & { status?: number }).status = res.status;
        throw err;
      }

      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Nomorobo API JSON root must be an object");
      }

      return mapNomoroboCheckJsonToSpamCheckResult(
        parsed as NomoroboCheckResponse,
        { qualitySpamThreshold },
      );
    },
  };
}

export function createNomoroboSpamCheckProviderFromEnv(
  env: NomoroboSpamProviderEnv = process.env,
  enabled: boolean,
  fetchImpl?: typeof fetch,
): SpamCheckProvider {
  return createNomoroboSpamCheckProvider({
    enabled,
    apiKey: env[NOMOROBO_API_KEY_ENV_KEY],
    fetchImpl,
  });
}

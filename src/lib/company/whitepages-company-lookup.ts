/**
 * Phase 6.4 — Whitepages Pro reverse phone → company hint (§6.4.2).
 *
 * @see https://api.whitepages.com/docs/documentation/person-search/reverse-phone-lookup
 *
 * Returns `company_name` from the top person record when present. That field is often
 * the number holder's employer, not the telemarketer — use only as enrichment after
 * Nomorobo/Twilio; Q13 remains the legal fallback (spike doc).
 */

import {
  getCompanyLookupFeatureFlags,
  getWhitepagesApiKey,
  type CompanyLookupEnv,
} from "@/lib/company/company-lookup-flags";

export const WHITEPAGES_PERSON_API_BASE =
  "https://api.whitepages.com/v2/person" as const;

export const DEFAULT_WHITEPAGES_LOOKUP_TIMEOUT_MS = 5_000;

export type WhitepagesPersonRecord = {
  id?: string;
  name?: string | null;
  company_name?: string | null;
  job_title?: string | null;
  phones?: Array<{ number?: string; type?: string; score?: number }>;
  [key: string]: unknown;
};

export type WhitepagesCompanyLookupResult = {
  companyName: string | null;
  skippedReason:
    | "disabled"
    | "missing_credentials"
    | "invalid_phone"
    | "http_error"
    | "parse_error"
    | "no_match"
    | null;
  httpStatus?: number;
  raw: unknown;
};

export type WhitepagesCompanyLookupOptions = {
  enabled?: boolean;
  apiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  env?: CompanyLookupEnv;
};

/**
 * Whitepages `phone` query expects US 10-digit NANP (no +1).
 */
export function formatPhoneDigitsForWhitepages(e164: string): string | null {
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  if (digits.length === 10) {
    return digits;
  }
  return null;
}

function extractCompanyNameFromPersons(
  body: unknown,
): string | null {
  if (!Array.isArray(body) || body.length === 0) {
    return null;
  }
  for (const row of body) {
    if (typeof row !== "object" || row === null) {
      continue;
    }
    const company = (row as WhitepagesPersonRecord).company_name;
    if (typeof company === "string" && company.trim() !== "") {
      return company.trim();
    }
  }
  return null;
}

/**
 * Reverse phone lookup via `GET /v2/person?phone=…` when enabled and keyed.
 */
export async function lookupCompanyFromWhitepages(
  phoneNumberNormalized: string,
  options: WhitepagesCompanyLookupOptions = {},
): Promise<WhitepagesCompanyLookupResult> {
  const env = options.env ?? process.env;
  const flags = getCompanyLookupFeatureFlags(env);
  const enabled = options.enabled ?? flags.whitepagesEnabled;
  const apiKey = options.apiKey ?? getWhitepagesApiKey(env);

  if (!enabled) {
    return { companyName: null, skippedReason: "disabled", raw: { skipped: true } };
  }
  if (!apiKey) {
    return {
      companyName: null,
      skippedReason: "missing_credentials",
      raw: { skipped: true, reason: "missing_credentials" },
    };
  }

  const phoneDigits = formatPhoneDigitsForWhitepages(phoneNumberNormalized);
  if (!phoneDigits) {
    return {
      companyName: null,
      skippedReason: "invalid_phone",
      raw: { skipped: true, reason: "invalid_phone" },
    };
  }

  const url = new URL(WHITEPAGES_PERSON_API_BASE);
  url.searchParams.set("phone", phoneDigits);

  const timeoutMs = options.timeoutMs ?? DEFAULT_WHITEPAGES_LOOKUP_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url.toString(), {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      return {
        companyName: null,
        skippedReason: "parse_error",
        httpStatus: response.status,
        raw: { error: "invalid_json", status: response.status, body_preview: text.slice(0, 200) },
      };
    }

    if (!response.ok) {
      return {
        companyName: null,
        skippedReason: "http_error",
        httpStatus: response.status,
        raw: parsed,
      };
    }

    const companyName = extractCompanyNameFromPersons(parsed);
    return {
      companyName,
      skippedReason: companyName ? null : "no_match",
      httpStatus: response.status,
      raw: parsed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch_failed";
    return {
      companyName: null,
      skippedReason: "http_error",
      raw: { error: message },
    };
  } finally {
    clearTimeout(timer);
  }
}

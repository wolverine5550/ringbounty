/**
 * Phase 7.5.1b — Soft OpenCorporates lookup after Q13 `user_input` (not a hard gate).
 *
 * @see https://api.opencorporates.com/documentation/API-Reference
 * §6.5 will extend this client for registered-agent lookup.
 */

import {
  USER_INPUT_UNVERIFIED,
  USER_INPUT_VERIFIED,
  type CompanyNameVerificationStatus,
} from "@/lib/constants/company-name-verification";

export const OPENCORPORATES_API_TOKEN_ENV_KEY =
  "OPENCORPORATES_API_TOKEN" as const;

const OPENCORPORATES_SEARCH_BASE =
  "https://api.opencorporates.com/v0.4/companies/search" as const;

export const DEFAULT_OPENCORPORATES_TIMEOUT_MS = 5_000;

export type OpenCorporatesSoftVerifyResult = {
  status: CompanyNameVerificationStatus;
  skippedReason: "missing_token" | "empty_name" | "http_error" | "no_results" | null;
  httpStatus?: number;
  raw: unknown;
};

export type OpenCorporatesSoftVerifyOptions = {
  apiToken?: string;
  /** USPS state code — optional `jurisdiction_code=us_XX` filter. */
  userStateCode?: string | null;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  env?: Record<string, string | undefined>;
};

function getApiToken(
  options: OpenCorporatesSoftVerifyOptions,
): string | undefined {
  const fromOpt = options.apiToken?.trim();
  if (fromOpt) {
    return fromOpt;
  }
  const fromEnv = options.env?.[OPENCORPORATES_API_TOKEN_ENV_KEY]?.trim();
  return fromEnv || undefined;
}

/** Maps `CO` → `us_co` for OpenCorporates jurisdiction filter. */
export function toOpenCorporatesJurisdictionCode(
  stateCode: string | null | undefined,
): string | null {
  const trimmed = stateCode?.trim().toUpperCase();
  if (!trimmed || !/^[A-Z]{2}$/.test(trimmed)) {
    return null;
  }
  return `us_${trimmed.toLowerCase()}`;
}

function hasSearchResults(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }
  const results = (body as { results?: { companies?: unknown[] } }).results
    ?.companies;
  return Array.isArray(results) && results.length > 0;
}

/**
 * Attempts OpenCorporates company search; never throws for API failures (soft path).
 */
export async function softVerifyCompanyNameWithOpenCorporates(
  companyName: string,
  options: OpenCorporatesSoftVerifyOptions = {},
): Promise<OpenCorporatesSoftVerifyResult> {
  const trimmed = companyName.trim();
  if (!trimmed) {
    return {
      status: USER_INPUT_UNVERIFIED,
      skippedReason: "empty_name",
      raw: { skipped: true },
    };
  }

  const token = getApiToken(options);
  if (!token) {
    return {
      status: USER_INPUT_UNVERIFIED,
      skippedReason: "missing_token",
      raw: { skipped: true, reason: "missing_token" },
    };
  }

  const url = new URL(OPENCORPORATES_SEARCH_BASE);
  url.searchParams.set("q", trimmed);
  const jurisdiction = toOpenCorporatesJurisdictionCode(options.userStateCode);
  if (jurisdiction) {
    url.searchParams.set("jurisdiction_code", jurisdiction);
  }
  url.searchParams.set("api_token", token);

  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_OPENCORPORATES_TIMEOUT_MS,
  );

  try {
    const response = await fetchImpl(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      return {
        status: USER_INPUT_UNVERIFIED,
        skippedReason: "http_error",
        httpStatus: response.status,
        raw: { error: "invalid_json" },
      };
    }

    if (!response.ok) {
      return {
        status: USER_INPUT_UNVERIFIED,
        skippedReason: "http_error",
        httpStatus: response.status,
        raw: parsed,
      };
    }

    if (hasSearchResults(parsed)) {
      return {
        status: USER_INPUT_VERIFIED,
        skippedReason: null,
        httpStatus: response.status,
        raw: parsed,
      };
    }

    return {
      status: USER_INPUT_UNVERIFIED,
      skippedReason: "no_results",
      httpStatus: response.status,
      raw: parsed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch_failed";
    return {
      status: USER_INPUT_UNVERIFIED,
      skippedReason: "http_error",
      raw: { error: message },
    };
  } finally {
    clearTimeout(timer);
  }
}

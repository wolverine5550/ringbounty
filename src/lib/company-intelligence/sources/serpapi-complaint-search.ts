/**
 * CI-4.1 — SerpAPI Google complaint search for Lane B Round 3.
 *
 * Query pattern per company_id_task_manager: `"${phone}" robocall OR spam OR complaint OR "who called"`.
 * Raw snippets land in `company_intelligence_runs.raw_results` (CI-4.1.3); company extraction is CI-4.2.
 *
 * @see https://serpapi.com/search-api — `GET https://serpapi.com/search.json`
 */

import {
  formatUsPhoneMask,
  normalizeNanp10Key,
} from "@/lib/check/us-phone";
import { parseBooleanEnv } from "@/lib/spam/provider-flags";

import type { CompanyIntelligenceEnv } from "../company-intelligence-flags";
import type { IntelSourceHit } from "../types";

export const SERPAPI_API_KEY_ENV_KEY = "SERPAPI_API_KEY" as const;

/** When false/unset, Round 3 SerpAPI is skipped (default off until keys in staging). */
export const COMPANY_INTEL_SERP_ENABLED_ENV_KEY =
  "COMPANY_INTEL_SERP_ENABLED" as const;

export const SERPAPI_SEARCH_API_URL = "https://serpapi.com/search.json" as const;

export const DEFAULT_SERPAPI_COMPLAINT_SEARCH_TIMEOUT_MS = 10_000;

/** SerpAPI `num` — organic results cap (CI-4.1.2). */
export const SERPAPI_COMPLAINT_SEARCH_NUM = 10;

/** One organic result snippet safe for `raw_results` (no api_key). */
export type SerpapiComplaintSnippet = {
  position: number;
  title: string;
  link: string;
  snippet: string;
};

export type SerpapiComplaintSearchSkippedReason =
  | "disabled"
  | "missing_credentials"
  | "invalid_phone"
  | "http_error"
  | "parse_error";

export type SerpapiComplaintSearchResult = {
  query: string | null;
  snippets: SerpapiComplaintSnippet[];
  skippedReason: SerpapiComplaintSearchSkippedReason | null;
  httpStatus?: number;
  /** Stored under `raw_results.round_3.serpapi` — never includes `api_key`. */
  raw: Record<string, unknown>;
};

export type SerpapiComplaintSearchOptions = {
  enabled?: boolean;
  apiKey?: string;
  env?: CompanyIntelligenceEnv;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

/** Subset of SerpAPI Google JSON used for snippet extraction. */
type SerpapiOrganicRow = {
  position?: number;
  title?: string;
  link?: string;
  snippet?: string;
};

type SerpapiSearchResponse = {
  organic_results?: SerpapiOrganicRow[];
  error?: string;
};

export function isSerpapiComplaintSearchEnabled(
  env: CompanyIntelligenceEnv = process.env,
): boolean {
  return parseBooleanEnv(env[COMPANY_INTEL_SERP_ENABLED_ENV_KEY]);
}

export function getSerpapiApiKey(
  env: CompanyIntelligenceEnv = process.env,
): string | undefined {
  const key = env[SERPAPI_API_KEY_ENV_KEY]?.trim();
  return key ? key : undefined;
}

/**
 * Builds the Google query for complaint-site discovery (CI-4.1.2).
 * Uses NANP display format inside quotes for better match quality.
 */
export function buildSerpapiComplaintSearchQuery(
  phoneNumberNormalized: string,
): string | null {
  const ten = normalizeNanp10Key(phoneNumberNormalized);
  if (!ten) {
    return null;
  }
  const display = formatUsPhoneMask(ten);
  return `"${display}" robocall OR spam OR complaint OR "who called"`;
}

/**
 * Redacts phone-like patterns before any server log line (CI-4.1.3).
 */
export function redactPhonePiiForLog(text: string): string {
  return text
    .replace(/\+1\d{10}/g, "[PHONE_REDACTED]")
    .replace(/\(\d{3}\)\s*\d{3}-\d{4}/g, "[PHONE_REDACTED]")
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE_REDACTED]")
    .replace(/\b1?\d{10,11}\b/g, "[PHONE_REDACTED]");
}

function parseOrganicSnippets(body: unknown): SerpapiComplaintSnippet[] {
  if (typeof body !== "object" || body === null) {
    return [];
  }
  const organic = (body as SerpapiSearchResponse).organic_results;
  if (!Array.isArray(organic)) {
    return [];
  }

  const snippets: SerpapiComplaintSnippet[] = [];
  for (const row of organic.slice(0, SERPAPI_COMPLAINT_SEARCH_NUM)) {
    if (typeof row !== "object" || row === null) {
      continue;
    }
    const title = typeof row.title === "string" ? row.title.trim() : "";
    const link = typeof row.link === "string" ? row.link.trim() : "";
    const snippet = typeof row.snippet === "string" ? row.snippet.trim() : "";
    const position =
      typeof row.position === "number" && Number.isFinite(row.position)
        ? row.position
        : snippets.length + 1;
    if (!title && !snippet) {
      continue;
    }
    snippets.push({ position, title, link, snippet });
  }
  return snippets;
}

function skipped(
  reason: SerpapiComplaintSearchSkippedReason,
  raw: Record<string, unknown> = { skipped: true, reason },
): SerpapiComplaintSearchResult {
  return {
    query: null,
    snippets: [],
    skippedReason: reason,
    raw,
  };
}

/**
 * CI-4.1.2 — SerpAPI Google search; returns snippets for Round 3 / `raw_results`.
 */
export async function searchComplaintSnippetsViaSerpapi(
  phoneNumberNormalized: string,
  options: SerpapiComplaintSearchOptions = {},
): Promise<SerpapiComplaintSearchResult> {
  const env = options.env ?? process.env;
  const enabled = options.enabled ?? isSerpapiComplaintSearchEnabled(env);
  const apiKey = options.apiKey ?? getSerpapiApiKey(env);

  if (!enabled) {
    return skipped("disabled");
  }
  if (!apiKey) {
    return skipped("missing_credentials");
  }

  const query = buildSerpapiComplaintSearchQuery(phoneNumberNormalized);
  if (!query) {
    return skipped("invalid_phone");
  }

  const params = new URLSearchParams({
    engine: "google",
    q: query,
    num: String(SERPAPI_COMPLAINT_SEARCH_NUM),
    api_key: apiKey,
  });

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs =
    options.timeoutMs ?? DEFAULT_SERPAPI_COMPLAINT_SEARCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(`${SERPAPI_SEARCH_API_URL}?${params}`, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(
        "[serpapi-complaint-search]",
        redactPhonePiiForLog(`HTTP ${res.status} (query omitted from logs)`),
      );
      return {
        ...skipped("http_error", {
          skipped: false,
          http_error: true,
          http_status: res.status,
        }),
        query,
        httpStatus: res.status,
      };
    }

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      console.error(
        "[serpapi-complaint-search]",
        redactPhonePiiForLog("JSON parse failed (query omitted from logs)"),
      );
      return { ...skipped("parse_error"), query };
    }

    const apiError =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as SerpapiSearchResponse).error === "string"
        ? (body as SerpapiSearchResponse).error
        : null;
    if (apiError) {
      console.error(
        "[serpapi-complaint-search]",
        redactPhonePiiForLog(`API error: ${apiError}`),
      );
      return {
        ...skipped("parse_error", { api_error: apiError }),
        query,
      };
    }

    const snippets = parseOrganicSnippets(body);
    return {
      query,
      snippets,
      skippedReason: null,
      httpStatus: res.status,
      raw: {
        query,
        result_count: snippets.length,
        snippets,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(
      "[serpapi-complaint-search]",
      redactPhonePiiForLog(`fetch failed: ${message}`),
    );
    return {
      ...skipped("http_error", { fetch_error: true }),
      query,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Maps SerpAPI output to orchestrator hits + `raw_results` payload (CI-4.1.3).
 * Company name extraction waits for CI-4.2 OpenRouter synthesis.
 */
export function serpapiResultToRound3Payload(
  serp: SerpapiComplaintSearchResult,
): {
  hits: IntelSourceHit[];
  rawResultsSlice: Record<string, unknown>;
  auditSkippedReason: string | null;
} {
  if (serp.skippedReason) {
    return {
      hits: [],
      rawResultsSlice: { serpapi: serp.raw },
      auditSkippedReason: `serpapi_${serp.skippedReason}`,
    };
  }

  return {
    hits: [{ tier: "serpapi", companyName: null }],
    rawResultsSlice: { serpapi: serp.raw },
    auditSkippedReason: null,
  };
}

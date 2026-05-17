/**
 * Shared OpenCorporates REST client (v0.4).
 *
 * @see https://api.opencorporates.com/documentation/API-Reference
 */

export const OPENCORPORATES_API_TOKEN_ENV_KEY =
  "OPENCORPORATES_API_TOKEN" as const;

export const OPENCORPORATES_API_VERSION = "v0.4" as const;

export const OPENCORPORATES_API_BASE =
  `https://api.opencorporates.com/${OPENCORPORATES_API_VERSION}` as const;

export const DEFAULT_OPENCORPORATES_TIMEOUT_MS = 5_000;

/** Common US incorporation jurisdictions when in-state search misses (§6.5.2). */
export const OPENCORPORATES_NATIONAL_FALLBACK_JURISDICTIONS = [
  "us_de",
  "us_nv",
  "us_wy",
] as const;

export type OpenCorporatesClientOptions = {
  apiToken?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  env?: Record<string, string | undefined>;
};

export type OpenCorporatesHttpResult<T = unknown> = {
  ok: boolean;
  status: number;
  parsed: T | null;
  error: string | null;
};

export function getOpenCorporatesApiToken(
  options: OpenCorporatesClientOptions,
): string | undefined {
  const fromOpt = options.apiToken?.trim();
  if (fromOpt) {
    return fromOpt;
  }
  const fromEnv = options.env?.[OPENCORPORATES_API_TOKEN_ENV_KEY]?.trim();
  return fromEnv || undefined;
}

/** Maps USPS `CO` → `us_co` for OpenCorporates jurisdiction filters. */
export function toOpenCorporatesJurisdictionCode(
  stateCode: string | null | undefined,
): string | null {
  const trimmed = stateCode?.trim().toUpperCase();
  if (!trimmed || !/^[A-Z]{2}$/.test(trimmed)) {
    return null;
  }
  return `us_${trimmed.toLowerCase()}`;
}

/**
 * GET helper — never throws; returns parsed JSON when possible.
 */
export async function openCorporatesGet(
  path: string,
  query: Record<string, string | undefined>,
  options: OpenCorporatesClientOptions = {},
): Promise<OpenCorporatesHttpResult> {
  const token = getOpenCorporatesApiToken(options);
  if (!token) {
    return {
      ok: false,
      status: 0,
      parsed: null,
      error: "missing_token",
    };
  }

  const url = new URL(
    path.startsWith("http") ? path : `${OPENCORPORATES_API_BASE}${path}`,
  );
  url.searchParams.set("api_token", token);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }

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
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      return {
        ok: false,
        status: response.status,
        parsed: null,
        error: "invalid_json",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        parsed,
        error: "http_error",
      };
    }

    return {
      ok: true,
      status: response.status,
      parsed,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch_failed";
    return {
      ok: false,
      status: 0,
      parsed: null,
      error: message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export type OpenCorporatesCompanyRef = {
  jurisdictionCode: string;
  companyNumber: string;
  name: string;
};

/** True when search response includes at least one company row (soft verify). */
export function hasCompanySearchResults(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }
  const companies = (
    body as { results?: { companies?: unknown[] } }
  ).results?.companies;
  return Array.isArray(companies) && companies.length > 0;
}

/** Parses `results.companies[]` from company search. */
export function parseCompanySearchResults(
  body: unknown,
): OpenCorporatesCompanyRef[] {
  if (!body || typeof body !== "object") {
    return [];
  }
  const companies = (
    body as { results?: { companies?: unknown[] } }
  ).results?.companies;
  if (!Array.isArray(companies)) {
    return [];
  }

  const refs: OpenCorporatesCompanyRef[] = [];
  for (const entry of companies) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const company = (entry as { company?: Record<string, unknown> }).company;
    if (!company) {
      continue;
    }
    const jurisdictionCode =
      typeof company.jurisdiction_code === "string"
        ? company.jurisdiction_code
        : null;
    const companyNumber =
      typeof company.company_number === "string"
        ? company.company_number
        : null;
    const name = typeof company.name === "string" ? company.name : null;
    if (!jurisdictionCode || !companyNumber || !name) {
      continue;
    }
    refs.push({ jurisdictionCode, companyNumber, name });
  }
  return refs;
}

export type OpenCorporatesOfficerSummary = {
  id: number;
  name: string;
  position: string | null;
  address: string | null;
  inactive: boolean;
};

function parseOfficerRecord(raw: unknown): OpenCorporatesOfficerSummary | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const wrapper = raw as { officer?: Record<string, unknown> };
  const officer: Record<string, unknown> =
    wrapper.officer && typeof wrapper.officer === "object"
      ? wrapper.officer
      : (raw as Record<string, unknown>);
  const id = typeof officer.id === "number" ? officer.id : null;
  const name = typeof officer.name === "string" ? officer.name : null;
  if (id === null || !name) {
    return null;
  }
  const position =
    typeof officer.position === "string" ? officer.position : null;
  const address =
    typeof officer.address === "string" ? officer.address : null;
  const inactive = officer.inactive === true;
  return { id, name, position, address, inactive };
}

/** Parses `results.company.officers` from company detail. */
export function parseCompanyOfficers(body: unknown): OpenCorporatesOfficerSummary[] {
  if (!body || typeof body !== "object") {
    return [];
  }
  const officers = (
    body as { results?: { company?: { officers?: unknown[] } } }
  ).results?.company?.officers;
  if (!Array.isArray(officers)) {
    return [];
  }
  return officers
    .map(parseOfficerRecord)
    .filter((o): o is OpenCorporatesOfficerSummary => o !== null);
}

/** Parses `results.officer` from officer detail. */
export function parseOfficerDetail(body: unknown): OpenCorporatesOfficerSummary | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const officer = (body as { results?: { officer?: unknown } }).results?.officer;
  return parseOfficerRecord(officer);
}

/** True when position looks like a registered agent (US filings). */
export function isRegisteredAgentPosition(position: string | null): boolean {
  if (!position) {
    return false;
  }
  const normalized = position.toLowerCase();
  return (
    normalized.includes("registered agent") ||
    normalized === "agent" ||
    normalized.includes("registered office") ||
    normalized.includes("statutory agent")
  );
}

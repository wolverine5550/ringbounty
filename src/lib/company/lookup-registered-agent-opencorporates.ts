/**
 * Phase 6.5 — OpenCorporates registered-agent lookup.
 *
 * Flow: company search (in-state → national fallbacks) → company detail → agent officer.
 *
 * @see https://api.opencorporates.com/documentation/API-Reference
 */

import {
  getOpenCorporatesApiToken,
  isRegisteredAgentPosition,
  openCorporatesGet,
  OPENCORPORATES_NATIONAL_FALLBACK_JURISDICTIONS,
  parseCompanyOfficers,
  parseCompanySearchResults,
  parseOfficerDetail,
  toOpenCorporatesJurisdictionCode,
  type OpenCorporatesClientOptions,
  type OpenCorporatesCompanyRef,
} from "./opencorporates-api";

export type RegisteredAgentLookupResult = {
  found: boolean;
  name: string | null;
  address: string | null;
  /** `opencorporates` when persisted; null when skipped or not found. */
  lookupSource: "opencorporates" | null;
  skippedReason:
    | "missing_token"
    | "empty_company_name"
    | "rate_limited"
    | "http_error"
    | "no_company_match"
    | "no_agent_officer"
    | null;
  matchedJurisdiction: string | null;
  httpStatus?: number;
  raw: unknown;
};

export type LookupRegisteredAgentOptions = OpenCorporatesClientOptions & {
  companyName: string;
  userStateCode?: string | null;
  /** When true, skip HTTP (caller already consumed budget). */
  rateLimited?: boolean;
};

async function searchCompanies(
  companyName: string,
  filters: Record<string, string | undefined>,
  options: OpenCorporatesClientOptions,
): Promise<{ refs: OpenCorporatesCompanyRef[]; httpStatus: number; raw: unknown }> {
  const response = await openCorporatesGet(
    "/companies/search",
    {
      q: companyName,
      order: "score",
      per_page: "10",
      page: "1",
      inactive: "false",
      ...filters,
    },
    options,
  );

  return {
    refs: response.ok ? parseCompanySearchResults(response.parsed) : [],
    httpStatus: response.status,
    raw: response.parsed ?? { error: response.error },
  };
}

async function fetchCompanyDetail(
  ref: OpenCorporatesCompanyRef,
  options: OpenCorporatesClientOptions,
): Promise<{ officers: ReturnType<typeof parseCompanyOfficers>; raw: unknown }> {
  const path = `/companies/${ref.jurisdictionCode}/${ref.companyNumber}`;
  const response = await openCorporatesGet(path, { sparse: "true" }, options);
  return {
    officers: response.ok ? parseCompanyOfficers(response.parsed) : [],
    raw: response.parsed ?? { error: response.error },
  };
}

async function fetchOfficerAddress(
  officerId: number,
  options: OpenCorporatesClientOptions,
): Promise<string | null> {
  const response = await openCorporatesGet(`/officers/${String(officerId)}`, {}, options);
  const detail = response.ok ? parseOfficerDetail(response.parsed) : null;
  return detail?.address ?? null;
}

function pickRegisteredAgent(
  officers: ReturnType<typeof parseCompanyOfficers>,
): (typeof officers)[number] | null {
  const active = officers.filter((o) => !o.inactive);
  return (
    active.find((o) => isRegisteredAgentPosition(o.position)) ??
    active.find((o) =>
      (o.position?.toLowerCase().includes("agent") ?? false),
    ) ??
    null
  );
}

/**
 * Resolves registered agent name/address via OpenCorporates; never throws.
 */
export async function lookupRegisteredAgentViaOpenCorporates(
  options: LookupRegisteredAgentOptions,
): Promise<RegisteredAgentLookupResult> {
  const companyName = options.companyName.trim();
  if (!companyName) {
    return {
      found: false,
      name: null,
      address: null,
      lookupSource: null,
      skippedReason: "empty_company_name",
      matchedJurisdiction: null,
      raw: { skipped: true },
    };
  }

  if (options.rateLimited) {
    return {
      found: false,
      name: null,
      address: null,
      lookupSource: null,
      skippedReason: "rate_limited",
      matchedJurisdiction: null,
      raw: { skipped: true, reason: "rate_limited" },
    };
  }

  const clientOptions: OpenCorporatesClientOptions = {
    apiToken: options.apiToken,
    timeoutMs: options.timeoutMs,
    fetchImpl: options.fetchImpl,
    env: options.env,
  };

  if (!getOpenCorporatesApiToken(options)) {
    return {
      found: false,
      name: null,
      address: null,
      lookupSource: null,
      skippedReason: "missing_token",
      matchedJurisdiction: null,
      raw: { skipped: true, reason: "missing_token" },
    };
  }

  const searchPhases: Array<Record<string, string | undefined>> = [];
  const inState = toOpenCorporatesJurisdictionCode(options.userStateCode);
  if (inState) {
    searchPhases.push({ jurisdiction_code: inState });
  }
  for (const jurisdiction of OPENCORPORATES_NATIONAL_FALLBACK_JURISDICTIONS) {
    if (jurisdiction !== inState) {
      searchPhases.push({ jurisdiction_code: jurisdiction });
    }
  }
  searchPhases.push({ country_code: "us" });

  let lastHttpStatus = 0;
  let lastRaw: unknown = null;
  let matchedRef: OpenCorporatesCompanyRef | null = null;

  for (const filters of searchPhases) {
    const search = await searchCompanies(companyName, filters, clientOptions);
    lastHttpStatus = search.httpStatus;
    lastRaw = search.raw;
    if (search.refs.length > 0) {
      matchedRef = search.refs[0] ?? null;
      break;
    }
  }

  if (!matchedRef) {
    return {
      found: false,
      name: null,
      address: null,
      lookupSource: null,
      skippedReason: "no_company_match",
      matchedJurisdiction: null,
      httpStatus: lastHttpStatus || undefined,
      raw: lastRaw,
    };
  }

  const detail = await fetchCompanyDetail(matchedRef, clientOptions);
  const agent = pickRegisteredAgent(detail.officers);
  if (!agent) {
    return {
      found: false,
      name: null,
      address: null,
      lookupSource: null,
      skippedReason: "no_agent_officer",
      matchedJurisdiction: matchedRef.jurisdictionCode,
      httpStatus: lastHttpStatus || undefined,
      raw: { search: lastRaw, detail: detail.raw },
    };
  }

  let address = agent.address;
  if (!address) {
    address = await fetchOfficerAddress(agent.id, clientOptions);
  }

  return {
    found: true,
    name: agent.name,
    address,
    lookupSource: "opencorporates",
    skippedReason: null,
    matchedJurisdiction: matchedRef.jurisdictionCode,
    httpStatus: lastHttpStatus || undefined,
    raw: { search: lastRaw, detail: detail.raw, agent_id: agent.id },
  };
}

/**
 * Phase 6.5 — Registered agent lookup UX and SOS manual-lookup guides.
 */

export const REGISTERED_AGENT_LOOKUP_SOURCE_OPENCORPORATES =
  "opencorporates" as const;

/** Shown when OpenCorporates could not resolve a registered agent. */
export const REGISTERED_AGENT_MANUAL_LOOKUP_MESSAGE =
  "We could not find a registered agent automatically. You may need to look up the company's registered agent on your state's Secretary of State website — your attorney can use this when evaluating service of process.";

/** Shown when the per-session OpenCorporates budget is exceeded (§6.5.5). */
export const OPENCORPORATES_RATE_LIMIT_USER_MESSAGE =
  "Registered agent lookup is temporarily unavailable. Please try again in about an hour.";

/**
 * Static SOS business-search URLs for high-volume states (§6.5.4 content).
 * Other states fall back to the generic NAICS/SOS index.
 */
export const STATE_SOS_BUSINESS_SEARCH_URL: Record<string, string> = {
  CA: "https://bizfileonline.sos.ca.gov/search/business",
  TX: "https://www.sos.state.tx.us/corp/sosda/index.shtml",
  FL: "https://search.sunbiz.org/Inquiry/CorporationSearch/ByName",
  NY: "https://apps.dos.ny.gov/publicInquiry/",
  PA: "https://www.corporations.pa.gov/search/corpsearch",
  IL: "https://www.ilsos.gov/corporatellc/",
  OH: "https://businesssearch.ohiosos.gov/",
  GA: "https://ecorp.sos.ga.gov/BusinessSearch",
  NC: "https://www.sosnc.gov/online_services/search/by_title/_Business_Registration",
  MI: "https://cofs.lara.state.mi.us/SearchApi/Search/Search",
  CO: "https://www.sos.state.co.us/biz/BusinessEntityCriteriaExt.do",
  DE: "https://icis.corp.delaware.gov/Ecorp/EntitySearch/NameSearch.aspx",
};

export const STATE_SOS_GENERIC_FALLBACK_URL =
  "https://www.nass.org/business-services" as const;

/** Returns a state SOS search URL when mapped, else generic NASS index. */
export function getStateSosBusinessSearchUrl(
  stateCode: string | null | undefined,
): string {
  const code = stateCode?.trim().toUpperCase();
  if (code && STATE_SOS_BUSINESS_SEARCH_URL[code]) {
    return STATE_SOS_BUSINESS_SEARCH_URL[code];
  }
  return STATE_SOS_GENERIC_FALLBACK_URL;
}

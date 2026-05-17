/**
 * Phase 7.5.1b — Soft OpenCorporates lookup after Q13 `user_input` (not a hard gate).
 *
 * @see https://api.opencorporates.com/documentation/API-Reference
 * §6.5 registered-agent lookup uses {@link lookupRegisteredAgentViaOpenCorporates}.
 */

import {
  USER_INPUT_UNVERIFIED,
  USER_INPUT_VERIFIED,
  type CompanyNameVerificationStatus,
} from "@/lib/constants/company-name-verification";

import {
  getOpenCorporatesApiToken,
  hasCompanySearchResults,
  openCorporatesGet,
  toOpenCorporatesJurisdictionCode,
  type OpenCorporatesClientOptions,
} from "./opencorporates-api";

export {
  DEFAULT_OPENCORPORATES_TIMEOUT_MS,
  OPENCORPORATES_API_TOKEN_ENV_KEY,
  toOpenCorporatesJurisdictionCode,
} from "./opencorporates-api";

export type OpenCorporatesSoftVerifyResult = {
  status: CompanyNameVerificationStatus;
  skippedReason: "missing_token" | "empty_name" | "http_error" | "no_results" | null;
  httpStatus?: number;
  raw: unknown;
};

export type OpenCorporatesSoftVerifyOptions = OpenCorporatesClientOptions & {
  /** USPS state code — optional `jurisdiction_code=us_XX` filter. */
  userStateCode?: string | null;
};

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

  if (!getOpenCorporatesApiToken(options)) {
    return {
      status: USER_INPUT_UNVERIFIED,
      skippedReason: "missing_token",
      raw: { skipped: true, reason: "missing_token" },
    };
  }

  const jurisdiction = toOpenCorporatesJurisdictionCode(options.userStateCode);
  const response = await openCorporatesGet(
    "/companies/search",
    {
      q: trimmed,
      ...(jurisdiction ? { jurisdiction_code: jurisdiction } : {}),
    },
    options,
  );

  if (!response.ok) {
    return {
      status: USER_INPUT_UNVERIFIED,
      skippedReason: "http_error",
      httpStatus: response.status,
      raw: response.parsed ?? { error: response.error },
    };
  }

  if (hasCompanySearchResults(response.parsed)) {
    return {
      status: USER_INPUT_VERIFIED,
      skippedReason: null,
      httpStatus: response.status,
      raw: response.parsed,
    };
  }

  return {
    status: USER_INPUT_UNVERIFIED,
    skippedReason: "no_results",
    httpStatus: response.status,
    raw: response.parsed,
  };
}

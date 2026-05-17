/**
 * Phase 6.4.2 — FTC dnc-complaints company lookup (spike; disabled in v0.1).
 *
 * See docs/spikes/20260516210000-ftc-complaints-company-lookup.md — API has no
 * filter by caller phone; `subject` is a category string, not a company legal name.
 */

export type FtcComplaintsCompanyLookupResult = {
  companyName: string | null;
  skippedReason:
    | "disabled"
    | "api_no_phone_filter"
    | "no_match"
    | null;
};

const TRUTHY = new Set(["true", "1", "yes", "on"]);

function isFtcComplaintsLookupEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const raw = env.FTC_DNC_COMPLAINTS_COMPANY_LOOKUP_ENABLED?.trim().toLowerCase();
  return raw !== undefined && TRUTHY.has(raw);
}

/**
 * Optional second-pass company resolver (§6.4.2). v0.1 always skips.
 */
export async function lookupCompanyFromFtcComplaints(_input: {
  phoneNumberNormalized: string;
  env?: Record<string, string | undefined>;
}): Promise<FtcComplaintsCompanyLookupResult> {
  if (!isFtcComplaintsLookupEnabled(_input.env)) {
    return { companyName: null, skippedReason: "disabled" };
  }

  // API cannot query by company-phone-number; bulk ETL would be required.
  return { companyName: null, skippedReason: "api_no_phone_filter" };
}

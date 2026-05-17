/**
 * Phase 6.4 — Apply third-party company lookups after spam merge (Whitepages, etc.).
 */

import type { MergedSpamCheckOutcome } from "@/lib/spam/merge-spam-results";
import type { Json } from "@/types/database";

import type { CompanyLookupEnv } from "@/lib/company/company-lookup-flags";
import { lookupCompanyFromWhitepages } from "@/lib/company/whitepages-company-lookup";

export type EnrichMergedCompanyParams = {
  phoneNumberNormalized: string;
  env?: CompanyLookupEnv;
};

export type EnrichMergedCompanyResult = {
  merged: MergedSpamCheckOutcome;
  /** Extra keys merged into `claim_subjects.metadata`. */
  metadataPatch: Record<string, Json>;
  /** Optional `claim_events` row for Whitepages raw response. */
  whitepagesProviderRaw: Json | null;
};

/**
 * When spam merge did not identify a company, runs flag-gated Whitepages reverse phone.
 * Does not call vendors for TCPA-exempt subjects (DNC/RA skipped downstream).
 */
export async function enrichMergedCompanyFromLookup(
  merged: MergedSpamCheckOutcome,
  params: EnrichMergedCompanyParams,
): Promise<EnrichMergedCompanyResult> {
  const metadataPatch: Record<string, Json> = {};
  let whitepagesProviderRaw: Json | null = null;

  if (merged.companyIdentified || merged.isExempt) {
    return { merged, metadataPatch, whitepagesProviderRaw };
  }

  const wp = await lookupCompanyFromWhitepages(params.phoneNumberNormalized, {
    env: params.env,
  });
  whitepagesProviderRaw = wp.raw as Json;
  metadataPatch.whitepages_lookup = {
    skipped_reason: wp.skippedReason,
    http_status: wp.httpStatus ?? null,
    company_name: wp.companyName,
  } as Json;

  if (wp.companyName && !merged.companyNameHint) {
    return {
      merged: {
        ...merged,
        companyNameHint: wp.companyName,
        companyNameHintSource: "whitepages",
      },
      metadataPatch: {
        ...metadataPatch,
        whitepages_suggested_company_name: wp.companyName,
      },
      whitepagesProviderRaw,
    };
  }

  return { merged, metadataPatch, whitepagesProviderRaw };
}

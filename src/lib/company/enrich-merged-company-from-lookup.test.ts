import { describe, expect, it, vi } from "vitest";

import type { MergedSpamCheckOutcome } from "@/lib/spam/merge-spam-results";

import { enrichMergedCompanyFromLookup } from "./enrich-merged-company-from-lookup";
import * as whitepages from "./whitepages-company-lookup";

function baseMerged(
  partial: Partial<MergedSpamCheckOutcome> = {},
): MergedSpamCheckOutcome {
  return {
    isKnownSpammer: false,
    confidenceScore: null,
    complaintCount: null,
    callCategory: null,
    companyName: null,
    companyNameSource: null,
    companyIdentified: false,
    companyNameHint: null,
    companyNameHintSource: null,
    spamDbSource: "none",
    isExempt: false,
    exemptReason: null,
    ...partial,
  };
}

describe("enrichMergedCompanyFromLookup (§6.4.2)", () => {
  it("skips when company already identified", async () => {
    const lookup = vi.spyOn(whitepages, "lookupCompanyFromWhitepages");
    const merged = baseMerged({
      companyIdentified: true,
      companyName: "Existing",
      companyNameSource: "nomorobo",
    });
    const r = await enrichMergedCompanyFromLookup(merged, {
      phoneNumberNormalized: "+12125550199",
    });
    expect(lookup).not.toHaveBeenCalled();
    expect(r.merged.companyName).toBe("Existing");
  });

  it("stores Whitepages company_name as hint only (not company_identified)", async () => {
    vi.spyOn(whitepages, "lookupCompanyFromWhitepages").mockResolvedValue({
      companyName: "Whitepages Employer Inc",
      skippedReason: null,
      raw: [],
    });

    const r = await enrichMergedCompanyFromLookup(baseMerged(), {
      phoneNumberNormalized: "+12125550199",
      env: {
        WHITEPAGES_COMPANY_LOOKUP_ENABLED: "true",
        WHITEPAGES_API_KEY: "key",
      },
    });

    expect(r.merged.companyIdentified).toBe(false);
    expect(r.merged.companyName).toBeNull();
    expect(r.merged.companyNameHint).toBe("Whitepages Employer Inc");
    expect(r.merged.companyNameHintSource).toBe("whitepages");
    expect(r.metadataPatch.whitepages_suggested_company_name).toBe(
      "Whitepages Employer Inc",
    );
  });
});

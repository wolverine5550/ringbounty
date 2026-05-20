import { describe, expect, it, vi } from "vitest";

import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import { persistSpamCheckOutcome } from "./persist-spam-check-outcome";
import { runSpamChecksForPhoneList } from "./spam-check-pipeline";
import type { SpamCheckProvider, SpamCheckResult } from "./types";

vi.mock("./persist-spam-check-outcome", () => ({
  persistSpamCheckOutcome: vi.fn().mockResolvedValue({
    isKnownSpammer: false,
    spamDbSource: "none",
    isExempt: false,
    companyIdentified: false,
    callCategory: "robocall",
  }),
}));

vi.mock("@/lib/company-intelligence/enqueue-company-intelligence-run", () => ({
  maybeEnqueueCompanyIntelligenceRun: vi
    .fn()
    .mockResolvedValue({ enqueued: true, runId: "run-1" }),
}));

function providerReturning(result: SpamCheckResult): SpamCheckProvider {
  return { async check() { return result; } };
}

describe("runSpamChecksForPhoneList", () => {
  it("persists per subject and returns provider outcomes", async () => {
    const admin = createMockSupabaseClient();
    const outcomes = await runSpamChecksForPhoneList(admin, {
      claimId: "claim-1",
      phones: [{ phoneNumberNormalized: "+12125550199", subjectId: "sub-1" }],
      clientIp: "127.0.0.1",
      providers: [
        providerReturning({
          isSpam: true,
          score: 90,
          complaints: 5,
          category: "robocall",
          companyName: null,
          raw: {},
          providerId: "nomorobo",
        }),
        providerReturning({
          isSpam: false,
          score: null,
          complaints: null,
          category: null,
          companyName: null,
          raw: { skipped: true, reason: "disabled" },
          providerId: "twilio",
        }),
      ],
    });

    expect(persistSpamCheckOutcome).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({ claimSubjectId: "sub-1" }),
    );
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.providers).toHaveLength(2);
    expect(outcomes[0]?.had_provider_failure).toBe(false);
    expect(outcomes[0]?.is_exempt).toBe(false);
    expect(outcomes[0]?.call_category).toBe("robocall");
    expect(outcomes[0]?.is_known_spammer).toBe(false);
    expect(outcomes[0]?.is_debt_collection).toBe(false);
    expect(outcomes[0]?.company_intel_enqueued).toBe(true);
  });
});

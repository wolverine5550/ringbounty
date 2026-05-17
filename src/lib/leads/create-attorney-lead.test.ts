import { describe, expect, it, vi } from "vitest";

import { AttorneyReferralNotAllowedError } from "@/lib/claims/can-refer-to-attorney";
import { createMockSupabaseClient } from "@/test-utils/mockSupabaseClient";

import {
  AttorneyReferralConsentRequiredError,
  createAttorneyLead,
} from "./create-attorney-lead";

describe("createAttorneyLead (§13.1.3)", () => {
  it("requires lead sharing consent", async () => {
    const userSb = createMockSupabaseClient();
    const admin = createMockSupabaseClient();

    await expect(
      createAttorneyLead(userSb, admin, {
        claimId: "claim-1",
        userId: "user-1",
        userEmail: "a@example.com",
        leadSharingConsent: false,
      }),
    ).rejects.toBeInstanceOf(AttorneyReferralConsentRequiredError);
  });

  it("rejects when no subject passes canReferToAttorney", async () => {
    const userSb = createMockSupabaseClient();
    const claimChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "claim-1",
          user_id: "user-1",
          violation_type: "tcpa",
          claim_strength: "strong",
          estimated_value_low_cents: 100,
          estimated_value_high_cents: 200,
          estimated_value_realistic_cents: 150,
        },
        error: null,
      }),
    };
    const subjectsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            id: "sub-1",
            is_exempt: true,
            company_identified: true,
            call_category: null,
          },
        ],
        error: null,
      }),
    };

    vi.mocked(userSb.from).mockImplementation(((table: string) => {
      if (table === "claims") {
        return claimChain as never;
      }
      if (table === "claim_subjects") {
        return subjectsChain as never;
      }
      throw new Error(`unexpected table ${table}`);
    }) as typeof userSb.from);

    const admin = createMockSupabaseClient();

    await expect(
      createAttorneyLead(userSb, admin, {
        claimId: "claim-1",
        userId: "user-1",
        userEmail: "a@example.com",
        leadSharingConsent: true,
      }),
    ).rejects.toBeInstanceOf(AttorneyReferralNotAllowedError);
  });
});

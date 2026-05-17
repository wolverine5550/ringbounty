import { describe, expect, it } from "vitest";

import {
  ATTORNEY_REFERRAL_REASON_CLAIM_INELIGIBLE,
  ATTORNEY_REFERRAL_REASON_COMPANY_UNIDENTIFIED,
  ATTORNEY_REFERRAL_REASON_EXEMPT,
  ATTORNEY_REFERRAL_REASON_FDCPA_DEBT_COLLECTION,
} from "@/lib/constants/attorney-referral";

import {
  assertCanReferToAttorney,
  AttorneyReferralNotAllowedError,
  canPurchaseLetter,
  canReferToAttorney,
} from "./can-refer-to-attorney";

describe("canReferToAttorney (§6.6)", () => {
  it("allows strong claim with identified non-exempt telemarketer", () => {
    expect(
      canReferToAttorney(
        { claim_strength: "strong" },
        {
          is_exempt: false,
          company_identified: true,
          call_category: "telemarketer",
        },
      ),
    ).toEqual({ ok: true, reasons: [] });
  });

  it("blocks exempt subject", () => {
    const r = canReferToAttorney(
      { claim_strength: "moderate" },
      {
        is_exempt: true,
        company_identified: true,
        call_category: "telemarketer",
      },
    );
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain(ATTORNEY_REFERRAL_REASON_EXEMPT);
  });

  it("blocks ineligible claim strength", () => {
    const r = canReferToAttorney(
      { claim_strength: "ineligible" },
      {
        is_exempt: false,
        company_identified: true,
        call_category: "telemarketer",
      },
    );
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain(ATTORNEY_REFERRAL_REASON_CLAIM_INELIGIBLE);
  });

  it("blocks unidentified company when not exempt", () => {
    const r = canReferToAttorney(
      { claim_strength: "weak" },
      {
        is_exempt: false,
        company_identified: false,
        call_category: "robocall",
      },
    );
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain(ATTORNEY_REFERRAL_REASON_COMPANY_UNIDENTIFIED);
  });

  it("blocks debt collection category", () => {
    const r = canReferToAttorney(
      { claim_strength: "strong" },
      {
        is_exempt: false,
        company_identified: true,
        call_category: "debt_collector",
      },
    );
    expect(r.ok).toBe(false);
    expect(r.reasons).toContain(ATTORNEY_REFERRAL_REASON_FDCPA_DEBT_COLLECTION);
  });

  it("assertCanReferToAttorney throws with reasons", () => {
    expect(() =>
      assertCanReferToAttorney(
        { claim_strength: "ineligible" },
        {
          is_exempt: false,
          company_identified: false,
          call_category: "telemarketer",
        },
      ),
    ).toThrow(AttorneyReferralNotAllowedError);
  });

  it("canPurchaseLetter aliases canReferToAttorney", () => {
    const input = {
      claim: { claim_strength: "moderate" as const },
      subject: {
        is_exempt: false,
        company_identified: true,
        call_category: "telemarketer",
      },
    };
    expect(canPurchaseLetter(input.claim, input.subject)).toEqual(
      canReferToAttorney(input.claim, input.subject),
    );
  });
});

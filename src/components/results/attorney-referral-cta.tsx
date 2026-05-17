"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ATTORNEY_REFERRAL_CTA_LABEL,
  ATTORNEY_REFERRAL_REASON_CLAIM_INELIGIBLE,
  ATTORNEY_REFERRAL_REASON_COMPANY_UNIDENTIFIED,
  ATTORNEY_REFERRAL_REASON_EXEMPT,
  ATTORNEY_REFERRAL_REASON_FDCPA_DEBT_COLLECTION,
} from "@/lib/constants/attorney-referral";
import { RESULTS_WEAK_STRENGTH_ACK_LABEL } from "@/lib/constants/results-strength";
import type { ResultsPageContext } from "@/lib/claims/load-results-page-context";

const BLOCK_REASON_LABELS: Record<string, string> = {
  [ATTORNEY_REFERRAL_REASON_EXEMPT]: "This number is marked exempt from TCPA screening.",
  [ATTORNEY_REFERRAL_REASON_CLAIM_INELIGIBLE]:
    "Claim strength is ineligible for attorney referral.",
  [ATTORNEY_REFERRAL_REASON_COMPANY_UNIDENTIFIED]:
    "Company must be identified during qualification.",
  [ATTORNEY_REFERRAL_REASON_FDCPA_DEBT_COLLECTION]:
    "Debt collection calls are not eligible for TCPA attorney referral here.",
};

export type AttorneyReferralCtaProps = {
  context: Pick<
    ResultsPageContext,
    "claimId" | "subjects" | "anyCanRefer" | "effectiveClaimStrength"
  >;
};

/**
 * Phase 8.4.5 — Attorney CTA on `/results` when {@link canReferToAttorney} passes (§6.6).
 * Weak strength requires acknowledgement before enabling the CTA (§8.4.3).
 * Full expectation flow wires in Phase 13.1.
 */
export function AttorneyReferralCta({ context }: AttorneyReferralCtaProps) {
  const requiresWeakAck = context.effectiveClaimStrength === "weak";
  const [weakAcknowledged, setWeakAcknowledged] = useState(false);

  const ctaDisabled =
    !context.anyCanRefer || (requiresWeakAck && !weakAcknowledged);

  return (
    <section className="flex flex-col gap-4 rounded-lg border p-4">
      <h2 className="text-sm font-medium">Attorney referral</h2>

      {context.anyCanRefer ? (
        <div className="flex flex-col gap-3">
          {requiresWeakAck ? (
            <div className="flex items-start gap-2 rounded-md border border-orange-500/30 bg-orange-500/5 p-3">
              <Checkbox
                id="weak-strength-ack"
                checked={weakAcknowledged}
                onCheckedChange={(checked) =>
                  setWeakAcknowledged(checked === true)
                }
              />
              <Label
                htmlFor="weak-strength-ack"
                className="text-sm leading-snug font-normal"
              >
                {RESULTS_WEAK_STRENGTH_ACK_LABEL}
              </Label>
            </div>
          ) : null}

          <Button type="button" disabled={ctaDisabled} aria-describedby="attorney-cta-note">
            {ATTORNEY_REFERRAL_CTA_LABEL}
          </Button>
          <p className="text-muted-foreground text-xs" id="attorney-cta-note">
            Attorney matching and lead submission ship in a later phase. Eligibility
            is based on your qualification answers and claim data.
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Attorney referral is not available for every number on this claim. See
          details below.
        </p>
      )}

      <ul className="flex flex-col gap-3 text-sm">
        {context.subjects.map((subject) => (
          <li key={subject.subjectId} className="flex flex-col gap-1">
            <span className="font-medium">
              {subject.phoneNumber ?? "Phone number on file"}
            </span>
            {subject.referral.ok ? (
              <span className="text-muted-foreground text-xs">
                Eligible for attorney referral when matching is available.
              </span>
            ) : (
              <ul className="text-muted-foreground list-inside list-disc text-xs">
                {subject.referral.reasons.map((reason) => (
                  <li key={reason}>
                    {BLOCK_REASON_LABELS[reason] ?? reason}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

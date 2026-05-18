"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EvidencePreservationChecklist } from "@/components/evidence/evidence-preservation-checklist";
import { DisclaimerBlock } from "@/components/marketing/disclaimer-block";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RESULTS_PATH } from "@/lib/claims/gated-routes";
import type { ClaimStrengthGate } from "@/lib/claims/successful-query";
import {
  ATTORNEY_REFERRAL_CONSENT_ACK_LABEL,
  ATTORNEY_REFERRAL_CONSENT_SHARE_LABEL,
  ATTORNEY_REFERRAL_CONTACT_WINDOW,
  ATTORNEY_REFERRAL_CONTINGENCY_INFO,
  ATTORNEY_REFERRAL_NO_REPRESENTATION,
  ATTORNEY_REFERRAL_SUBMIT_LABEL,
  ATTORNEY_REFERRAL_SUCCESS_BODY,
  ATTORNEY_REFERRAL_SUCCESS_HEADLINE,
} from "@/lib/constants/attorney-referral-expectations";
import { RESULTS_WEAK_STRENGTH_ACK_LABEL } from "@/lib/constants/results-strength";

export type AttorneyConnectFormProps = {
  claimId: string;
  effectiveClaimStrength: ClaimStrengthGate;
};

/**
 * Phase 13.1.2 — Expectations, consent, and submit for attorney referral.
 */
export function AttorneyConnectForm({
  claimId,
  effectiveClaimStrength,
}: AttorneyConnectFormProps) {
  const router = useRouter();
  const requiresWeakAck = effectiveClaimStrength === "weak";
  const [evidenceChecklistComplete, setEvidenceChecklistComplete] = useState(false);
  const [shareConsent, setShareConsent] = useState(false);
  const [ackConsent, setAckConsent] = useState(false);
  const [weakAcknowledged, setWeakAcknowledged] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    evidenceChecklistComplete &&
    shareConsent &&
    ackConsent &&
    (!requiresWeakAck || weakAcknowledged) &&
    !isSubmitting &&
    !submitted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/leads/attorney-referral", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_id: claimId,
          lead_sharing_consent: shareConsent,
        }),
      });

      const body = (await res.json()) as { error?: string };

      if (!res.ok) {
        setSubmitError(body.error ?? "Could not submit your request.");
        return;
      }

      setSubmitted(true);
      router.refresh();
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">{ATTORNEY_REFERRAL_SUCCESS_HEADLINE}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {ATTORNEY_REFERRAL_SUCCESS_BODY}
        </p>
        <Button type="button" variant="outline" asChild>
          <Link href={`${RESULTS_PATH}?claim=${claimId}`}>Back to results</Link>
        </Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={(ev) => void handleSubmit(ev)}>
      <EvidencePreservationChecklist
        onCanProceedChange={setEvidenceChecklistComplete}
      />

      <section className="flex flex-col gap-3 text-sm leading-relaxed">
        <p>{ATTORNEY_REFERRAL_CONTACT_WINDOW}</p>
        <p>{ATTORNEY_REFERRAL_CONTINGENCY_INFO}</p>
        <p className="text-muted-foreground">{ATTORNEY_REFERRAL_NO_REPRESENTATION}</p>
      </section>

      <DisclaimerBlock />

      {requiresWeakAck ? (
        <div className="flex items-start gap-2 rounded-md border border-orange-500/30 bg-orange-500/5 p-3">
          <Checkbox
            id="weak-strength-ack-connect"
            checked={weakAcknowledged}
            onCheckedChange={(checked) => setWeakAcknowledged(checked === true)}
          />
          <Label
            htmlFor="weak-strength-ack-connect"
            className="text-sm leading-snug font-normal"
          >
            {RESULTS_WEAK_STRENGTH_ACK_LABEL}
          </Label>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2">
          <Checkbox
            id="lead-share-consent"
            checked={shareConsent}
            onCheckedChange={(checked) => setShareConsent(checked === true)}
          />
          <Label htmlFor="lead-share-consent" className="text-sm leading-snug font-normal">
            {ATTORNEY_REFERRAL_CONSENT_SHARE_LABEL}
          </Label>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="lead-ack-consent"
            checked={ackConsent}
            onCheckedChange={(checked) => setAckConsent(checked === true)}
          />
          <Label htmlFor="lead-ack-consent" className="text-sm leading-snug font-normal">
            {ATTORNEY_REFERRAL_CONSENT_ACK_LABEL}
          </Label>
        </div>
      </div>

      {submitError ? (
        <p className="text-destructive text-sm" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? "Submitting…" : ATTORNEY_REFERRAL_SUBMIT_LABEL}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`${RESULTS_PATH}?claim=${claimId}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { FederalDncAttestationForm } from "@/components/qualify/federal-dnc-attestation-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  extractUsPhoneDigits,
  formatUsPhoneMask,
} from "@/lib/check/us-phone";
import {
  buildFederalDncReuseBodyWithPhone,
  FEDERAL_DNC_ATTESTATION_REQUIRED_MESSAGE,
  FEDERAL_DNC_RECEIVING_PHONE_HELP,
  FEDERAL_DNC_RECEIVING_PHONE_LABEL,
  FEDERAL_DNC_REUSE_ANSWER_AGAIN_LABEL,
  FEDERAL_DNC_REUSE_CONTINUE_LABEL,
  FEDERAL_DNC_REUSE_HEADLINE,
} from "@/lib/constants/federal-dnc-attestation";
import { buildQualifyPageHref } from "@/lib/qualify/qualify-step";
import { parseReceivingPhoneInput } from "@/lib/users/receiving-phone";

const FEDERAL_DNC_REUSE_BODY_NO_SAVED_PHONE =
  "You already confirmed National Do Not Call Registry status on another claim. We can apply the same answer to this claim after you confirm your receiving phone line below.";

export type FederalDncAttestationGateProps = {
  claimSubjectId: string;
  claimId: string;
  /** When set, user may reuse attestation from another claim on this account. */
  hasPriorAttestationForPhone: boolean;
  /** Receiving line saved on `public.users`. */
  savedReceivingPhoneDisplay?: string | null;
  /** Spammer/caller number from `/check` (not the DNC receiving line). */
  screenedCallerDisplay?: string | null;
  initialReceivingPhoneDisplay?: string | null;
  initialRegistered?: boolean | null;
  initialRegistrationDate?: string | null;
  initialScreenshotPath?: string | null;
};

/**
 * Federal DNC pre-gate: offer reuse for same account, or full attestation form.
 */
export function FederalDncAttestationGate({
  claimSubjectId,
  claimId,
  hasPriorAttestationForPhone,
  savedReceivingPhoneDisplay = null,
  screenedCallerDisplay = null,
  initialReceivingPhoneDisplay = null,
  initialRegistered = null,
  initialRegistrationDate = null,
  initialScreenshotPath = null,
}: FederalDncAttestationGateProps) {
  const router = useRouter();
  const receivingPhoneInputId = useId();
  const [showFullForm, setShowFullForm] = useState(!hasPriorAttestationForPhone);
  const [reuseError, setReuseError] = useState<string | null>(null);
  const [isReusing, setIsReusing] = useState(false);
  const [receivingDigits, setReceivingDigits] = useState(() =>
    savedReceivingPhoneDisplay
      ? extractUsPhoneDigits(savedReceivingPhoneDisplay)
      : "",
  );

  const needsReceivingPhoneOnReuse = !savedReceivingPhoneDisplay;
  const receivingParsed = parseReceivingPhoneInput(receivingDigits);
  const canReuse =
    !needsReceivingPhoneOnReuse || (receivingParsed.ok && receivingDigits.length > 0);

  const reuseBody = savedReceivingPhoneDisplay
    ? buildFederalDncReuseBodyWithPhone(savedReceivingPhoneDisplay)
    : FEDERAL_DNC_REUSE_BODY_NO_SAVED_PHONE;

  const handleReuse = async () => {
    if (!canReuse) {
      setReuseError(
        receivingParsed.ok === false
          ? receivingParsed.error
          : "Enter your receiving phone line to continue.",
      );
      return;
    }

    setIsReusing(true);
    setReuseError(null);
    try {
      const payload: Record<string, string> = {
        claim_subject_id: claimSubjectId,
      };
      if (needsReceivingPhoneOnReuse && receivingParsed.ok) {
        payload.receiving_phone = receivingParsed.value.display;
      }

      const res = await fetch("/api/qualify/federal-dnc/reuse-prior", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setReuseError(body.error ?? "Could not apply saved answer.");
        return;
      }
      router.push(
        buildQualifyPageHref({ claimSubjectId, step: 1, claimId }),
      );
      router.refresh();
    } finally {
      setIsReusing(false);
    }
  };

  if (!showFullForm && hasPriorAttestationForPhone) {
    return (
      <section className="flex flex-col gap-4 rounded-lg border p-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">{FEDERAL_DNC_REUSE_HEADLINE}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {reuseBody}
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {FEDERAL_DNC_ATTESTATION_REQUIRED_MESSAGE}
          </p>
        </div>
        {needsReceivingPhoneOnReuse ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor={receivingPhoneInputId}>
              {FEDERAL_DNC_RECEIVING_PHONE_LABEL}
            </Label>
            <Input
              id={receivingPhoneInputId}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="(555) 123-4567"
              value={formatUsPhoneMask(receivingDigits)}
              onChange={(e) => {
                setReceivingDigits(
                  extractUsPhoneDigits(e.target.value).slice(0, 10),
                );
              }}
            />
            <p className="text-muted-foreground text-xs">
              {FEDERAL_DNC_RECEIVING_PHONE_HELP}
            </p>
          </div>
        ) : null}
        {reuseError ? (
          <p className="text-destructive text-sm" role="alert">
            {reuseError}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={isReusing || !canReuse}
            onClick={() => void handleReuse()}
          >
            {isReusing ? "Applying…" : FEDERAL_DNC_REUSE_CONTINUE_LABEL}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isReusing}
            onClick={() => setShowFullForm(true)}
          >
            {FEDERAL_DNC_REUSE_ANSWER_AGAIN_LABEL}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <FederalDncAttestationForm
      claimSubjectId={claimSubjectId}
      screenedCallerDisplay={screenedCallerDisplay}
      initialReceivingPhoneDisplay={initialReceivingPhoneDisplay}
      initialRegistered={initialRegistered}
      initialRegistrationDate={initialRegistrationDate}
      initialScreenshotPath={initialScreenshotPath}
    />
  );
}

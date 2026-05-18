"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  extractUsPhoneDigits,
  formatUsPhoneMask,
} from "@/lib/check/us-phone";
import {
  DONOTCALL_GOV_URL,
  FEDERAL_DNC_ATTESTATION_REGISTERED_PROMPT,
  FEDERAL_DNC_ATTESTATION_REGISTRATION_DATE_LABEL,
  FEDERAL_DNC_ATTESTATION_REQUIRED_MESSAGE,
  FEDERAL_DNC_GATE_BLOCKED_MESSAGE,
  FEDERAL_DNC_OPTIONAL_SCREENSHOT_COPY,
  FEDERAL_DNC_OPTIONAL_SCREENSHOT_LABEL,
  FEDERAL_DNC_RECEIVING_LINE_NOTE,
  FEDERAL_DNC_RECEIVING_PHONE_HELP,
  FEDERAL_DNC_RECEIVING_PHONE_LABEL,
  FEDERAL_DNC_REGISTRATION_DATE_HELP,
  FEDERAL_DNC_SCREENED_CALLER_LABEL,
  FEDERAL_DNC_SELF_CHECK_INSTRUCTIONS,
} from "@/lib/constants/federal-dnc-attestation";
import { canProceedPastFederalDncGate } from "@/lib/dnc/federal-dnc-attestation-gate";
import { parseReceivingPhoneInput } from "@/lib/users/receiving-phone";

export type FederalDncAttestationFormProps = {
  claimSubjectId: string;
  /** Caller/spammer number from `/check` — not the consumer receiving line. */
  screenedCallerDisplay?: string | null;
  /** Saved on `public.users` from a prior claim. */
  initialReceivingPhoneDisplay?: string | null;
  initialRegistered?: boolean | null;
  initialRegistrationDate?: string | null;
  /** Existing Storage path when user already uploaded (§6.2.4). */
  initialScreenshotPath?: string | null;
};

/**
 * Phase 6.2.1 / 6.2.4 — Federal DNC attestation gate on `/qualify/[claimSubjectId]`.
 */
export function FederalDncAttestationForm({
  claimSubjectId,
  screenedCallerDisplay = null,
  initialReceivingPhoneDisplay = null,
  initialRegistered = null,
  initialRegistrationDate = null,
  initialScreenshotPath = null,
}: FederalDncAttestationFormProps) {
  const router = useRouter();
  const receivingPhoneInputId = useId();
  const [registered, setRegistered] = useState<boolean | null>(
    initialRegistered,
  );
  const [registrationDate, setRegistrationDate] = useState(
    initialRegistrationDate ?? "",
  );
  const [receivingDigits, setReceivingDigits] = useState(() =>
    initialReceivingPhoneDisplay
      ? extractUsPhoneDigits(initialReceivingPhoneDisplay)
      : "",
  );
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(
    initialRegistered !== null && initialRegistered !== undefined,
  );
  const [savedScreenshotPath, setSavedScreenshotPath] = useState<string | null>(
    initialScreenshotPath,
  );

  const receivingPhoneValid =
    parseReceivingPhoneInput(receivingDigits).ok ||
    (Boolean(initialReceivingPhoneDisplay) && receivingDigits.length === 0);

  const canSubmit =
    canProceedPastFederalDncGate({
      federalDncRegistered: registered,
      federalDncRegistrationDate: registrationDate,
    }) && receivingPhoneValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || registered === null) {
      setSubmitError(FEDERAL_DNC_GATE_BLOCKED_MESSAGE);
      return;
    }

    const receivingParsed = parseReceivingPhoneInput(receivingDigits);
    if (!receivingParsed.ok && !initialReceivingPhoneDisplay) {
      setSubmitError(receivingParsed.error);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("claim_subject_id", claimSubjectId);
      formData.append("federal_dnc_registered", String(registered));
      if (registered && registrationDate) {
        formData.append("federal_dnc_registration_date", registrationDate);
      }
      if (receivingParsed.ok) {
        formData.append("receiving_phone", receivingParsed.value.display);
      }
      if (screenshotFile) {
        formData.append("federal_dnc_confirmation_screenshot", screenshotFile);
      }

      const res = await fetch("/api/qualify/federal-dnc", {
        method: "POST",
        body: formData,
      });

      const body = (await res.json()) as {
        error?: string;
        federal_dnc_confirmation_screenshot_path?: string | null;
        receiving_phone?: string | null;
      };
      if (!res.ok) {
        setSubmitError(body.error ?? "Could not save your answers.");
        return;
      }

      setSaved(true);
      if (body.receiving_phone) {
        setReceivingDigits(extractUsPhoneDigits(body.receiving_phone));
      }
      if (body.federal_dnc_confirmation_screenshot_path) {
        setSavedScreenshotPath(body.federal_dnc_confirmation_screenshot_path);
        setScreenshotFile(null);
      }
      router.refresh();
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          {FEDERAL_DNC_ATTESTATION_REQUIRED_MESSAGE}
        </p>
        {screenedCallerDisplay ? (
          <p className="text-sm">
            {FEDERAL_DNC_SCREENED_CALLER_LABEL}{" "}
            <span className="font-medium">{screenedCallerDisplay}</span>
          </p>
        ) : null}
        <p className="text-muted-foreground text-sm leading-relaxed">
          {FEDERAL_DNC_RECEIVING_LINE_NOTE}
        </p>
        <p className="text-muted-foreground text-sm">
          {FEDERAL_DNC_SELF_CHECK_INSTRUCTIONS}{" "}
          <a
            className="text-primary underline underline-offset-2"
            href={DONOTCALL_GOV_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            donotcall.gov
          </a>
        </p>
      </div>

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
            setReceivingDigits(extractUsPhoneDigits(e.target.value).slice(0, 10));
          }}
          required={!initialReceivingPhoneDisplay}
        />
        <p className="text-muted-foreground text-xs">
          {FEDERAL_DNC_RECEIVING_PHONE_HELP}
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">
          {FEDERAL_DNC_ATTESTATION_REGISTERED_PROMPT}
        </legend>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant={registered === true ? "default" : "outline"}
            onClick={() => setRegistered(true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={registered === false ? "default" : "outline"}
            onClick={() => {
              setRegistered(false);
              setRegistrationDate("");
            }}
          >
            No
          </Button>
        </div>
      </fieldset>

      {registered === true ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="federal-dnc-registration-date">
            {FEDERAL_DNC_ATTESTATION_REGISTRATION_DATE_LABEL}
          </Label>
          <Input
            id="federal-dnc-registration-date"
            type="date"
            value={registrationDate}
            onChange={(e) => setRegistrationDate(e.target.value)}
            required
          />
          <p className="text-muted-foreground text-xs">
            {FEDERAL_DNC_REGISTRATION_DATE_HELP}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="federal-dnc-screenshot">
          {FEDERAL_DNC_OPTIONAL_SCREENSHOT_LABEL}
        </Label>
        <Input
          id="federal-dnc-screenshot"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setScreenshotFile(file);
          }}
        />
        <p className="text-muted-foreground text-xs">
          {FEDERAL_DNC_OPTIONAL_SCREENSHOT_COPY}
        </p>
        {savedScreenshotPath && !screenshotFile ? (
          <p className="text-success text-xs">
            A confirmation file is already saved on your account. Uploading a
            new file will replace it for this claim.
          </p>
        ) : null}
      </div>

      {submitError ? (
        <p className="text-danger text-sm" role="alert">
          {submitError}
        </p>
      ) : null}

      {saved ? (
        <p className="text-success text-sm">
          Saved. Continuing to qualification step 1… Federal DNC eligibility for
          scoring will update when you enter call dates (Phase 7.4).
        </p>
      ) : null}

      <Button type="submit" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "Saving…" : "Save and continue"}
      </Button>
    </form>
  );
}

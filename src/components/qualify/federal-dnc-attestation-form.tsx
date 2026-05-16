"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DONOTCALL_GOV_URL,
  FEDERAL_DNC_ATTESTATION_REGISTERED_PROMPT,
  FEDERAL_DNC_ATTESTATION_REGISTRATION_DATE_LABEL,
  FEDERAL_DNC_ATTESTATION_REQUIRED_MESSAGE,
  FEDERAL_DNC_GATE_BLOCKED_MESSAGE,
  FEDERAL_DNC_OPTIONAL_SCREENSHOT_COPY,
  FEDERAL_DNC_OPTIONAL_SCREENSHOT_LABEL,
  FEDERAL_DNC_REGISTRATION_DATE_HELP,
  FEDERAL_DNC_SELF_CHECK_INSTRUCTIONS,
} from "@/lib/constants/federal-dnc-attestation";
import { canProceedPastFederalDncGate } from "@/lib/dnc/federal-dnc-attestation-gate";

export type FederalDncAttestationFormProps = {
  claimSubjectId: string;
  /** Masked display for context (e.g. (555) 123-4567). */
  phoneDisplay?: string | null;
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
  phoneDisplay,
  initialRegistered = null,
  initialRegistrationDate = null,
  initialScreenshotPath = null,
}: FederalDncAttestationFormProps) {
  const [registered, setRegistered] = useState<boolean | null>(
    initialRegistered,
  );
  const [registrationDate, setRegistrationDate] = useState(
    initialRegistrationDate ?? "",
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

  const canSubmit = canProceedPastFederalDncGate({
    federalDncRegistered: registered,
    federalDncRegistrationDate: registrationDate,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || registered === null) {
      setSubmitError(FEDERAL_DNC_GATE_BLOCKED_MESSAGE);
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
      };
      if (!res.ok) {
        setSubmitError(body.error ?? "Could not save your answers.");
        return;
      }

      setSaved(true);
      if (body.federal_dnc_confirmation_screenshot_path) {
        setSavedScreenshotPath(body.federal_dnc_confirmation_screenshot_path);
        setScreenshotFile(null);
      }
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
        {phoneDisplay ? (
          <p className="text-sm">
            Number checked: <span className="font-medium">{phoneDisplay}</span>
          </p>
        ) : null}
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
          accept="image/jpeg,image/png,image/webp,image/gif"
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
            A screenshot is already saved for this number. Uploading a new
            file will replace it.
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
          Saved. Additional qualification steps ship in Phase 7; federal DNC
          eligibility for scoring will update when you enter call dates.
        </p>
      ) : null}

      <Button type="submit" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "Saving…" : "Save and continue"}
      </Button>
    </form>
  );
}

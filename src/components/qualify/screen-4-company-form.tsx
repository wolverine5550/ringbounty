"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMPANY_NAME_UNVERIFIED_WARNING } from "@/lib/constants/company-name-verification";
import {
  QUALIFY_Q13_CALLBACK_PROMPT,
  QUALIFY_Q13_PITCH_PROMPT,
  QUALIFY_Q13_OPTIONAL_HINT,
  QUALIFY_Q13_PROMPT,
  QUALIFY_Q14_PROMPT,
  QUALIFY_VOICEMAIL_PROMPT,
  QUALIFY_VOICEMAIL_TRANSCRIPT_LABEL,
  QUALIFY_VOICEMAIL_TRANSCRIPTION_UNAVAILABLE,
} from "@/lib/constants/qualify-screen-4";
import { buildQualifyPageHref } from "@/lib/qualify/qualify-step";
import type { QualifyScreen4Answers } from "@/lib/qualify/screen-4-company-identification";

export type Screen4CompanyFormProps = {
  claimSubjectId: string;
  claimId: string;
  initialAnswers?: QualifyScreen4Answers | null;
  /** Pre-filled from `claim_subjects.company_name` when events are empty. */
  initialCompanyName?: string | null;
};

type YesNoFieldProps = {
  legend: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
};

function YesNoField({ legend, value, onChange }: YesNoFieldProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant={value === true ? "default" : "outline"}
          onClick={() => onChange(true)}
        >
          Yes
        </Button>
        <Button
          type="button"
          variant={value === false ? "default" : "outline"}
          onClick={() => onChange(false)}
        >
          No
        </Button>
      </div>
    </fieldset>
  );
}

/**
 * Phase 7.5 — Screen 4 voicemail upload, Q13 company, Q14 evidence flag.
 */
export function Screen4CompanyForm({
  claimSubjectId,
  claimId,
  initialAnswers = null,
  initialCompanyName = null,
}: Screen4CompanyFormProps) {
  const router = useRouter();
  const [hasVoicemail, setHasVoicemail] = useState<boolean | null>(null);
  const [voicemailFile, setVoicemailFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState(
    initialAnswers?.voicemailTranscript ?? "",
  );
  const [voicemailIdentified, setVoicemailIdentified] = useState(
    initialAnswers?.companyIdentificationSource === "voicemail_transcription",
  );
  const [companyName, setCompanyName] = useState(
    initialAnswers?.companyName ?? initialCompanyName ?? "",
  );
  const [callbackPhone, setCallbackPhone] = useState(
    initialAnswers?.companyCallbackPhone ?? "",
  );
  const [productPitch, setProductPitch] = useState(
    initialAnswers?.companyProductPitch ?? "",
  );
  const [hasAdditionalEvidence, setHasAdditionalEvidence] = useState<boolean | null>(
    initialAnswers?.hasAdditionalEvidence ?? null,
  );
  const [showUnverifiedWarning, setShowUnverifiedWarning] = useState(
    initialAnswers?.verificationStatus === "user_input_unverified",
  );
  const [voicemailError, setVoicemailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploadingVoicemail, setIsUploadingVoicemail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = hasAdditionalEvidence !== null;

  const goToNextStep = (namedCompany: boolean) => {
    router.push(
      buildQualifyPageHref({
        claimSubjectId,
        claimId,
        step: namedCompany ? 5 : 6,
      }),
    );
    router.refresh();
  };

  const handleVoicemailUpload = async () => {
    if (!voicemailFile) {
      setVoicemailError("Choose an audio file first.");
      return;
    }

    setIsUploadingVoicemail(true);
    setVoicemailError(null);

    const formData = new FormData();
    formData.append("claim_subject_id", claimSubjectId);
    formData.append("voicemail_audio", voicemailFile);

    try {
      const res = await fetch("/api/qualify/voicemail", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const body = (await res.json()) as {
        error?: string;
        transcript?: string | null;
        company_name?: string | null;
        callback_phone?: string | null;
        product_pitch?: string | null;
        company_identified?: boolean;
        transcription_available?: boolean;
        transcription_error?: string;
        show_unverified_warning?: boolean;
      };

      if (!res.ok) {
        setVoicemailError(body.error ?? "Could not process voicemail.");
        return;
      }

      if (body.transcript) {
        setTranscript(body.transcript);
      }

      if (body.company_name) {
        setCompanyName(body.company_name);
      }
      if (body.callback_phone) {
        setCallbackPhone(body.callback_phone);
      }
      if (body.product_pitch) {
        setProductPitch(body.product_pitch);
      }

      if (body.company_identified) {
        setVoicemailIdentified(true);
      }

      if (body.show_unverified_warning) {
        setShowUnverifiedWarning(true);
      }

      if (body.transcription_available === false) {
        setVoicemailError(
          body.transcription_error ?? QUALIFY_VOICEMAIL_TRANSCRIPTION_UNAVAILABLE,
        );
      }
    } catch {
      setVoicemailError("Network error. Please try again.");
    } finally {
      setIsUploadingVoicemail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setSubmitError("Please answer all required questions.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const trimmedCompany = companyName.trim();
    const payload: Record<string, unknown> = {
      claim_subject_id: claimSubjectId,
      company_name: trimmedCompany,
      has_additional_evidence: hasAdditionalEvidence,
    };

    if (callbackPhone.trim()) {
      payload.company_callback_phone = callbackPhone.trim();
    }
    if (productPitch.trim()) {
      payload.company_product_pitch = productPitch.trim();
    }
    if (voicemailIdentified) {
      payload.skip_user_company_persist = true;
      payload.identification_source = "voicemail_transcription";
    }

    try {
      const res = await fetch("/api/qualify/screen-4", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await res.json()) as {
        error?: string;
        show_unverified_warning?: boolean;
      };

      if (!res.ok) {
        setSubmitError(body.error ?? "Could not save your answers.");
        return;
      }

      if (body.show_unverified_warning) {
        setShowUnverifiedWarning(true);
      }

      goToNextStep(trimmedCompany.length >= 2);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={(ev) => void handleSubmit(ev)}>
      <YesNoField
        legend={QUALIFY_VOICEMAIL_PROMPT}
        value={hasVoicemail}
        onChange={(value) => {
          setHasVoicemail(value);
          if (!value) {
            setVoicemailFile(null);
          }
        }}
      />

      {hasVoicemail === true ? (
        <div className="flex flex-col gap-3">
          <Label htmlFor="voicemail-audio">Upload voicemail (MP3, M4A, or WAV)</Label>
          <Input
            id="voicemail-audio"
            type="file"
            accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/wav"
            onChange={(e) => setVoicemailFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!voicemailFile || isUploadingVoicemail}
            onClick={() => void handleVoicemailUpload()}
          >
            {isUploadingVoicemail ? "Processing…" : "Upload and analyze voicemail"}
          </Button>
          {voicemailError ? (
            <p className="text-muted-foreground text-sm" role="status">
              {voicemailError}
            </p>
          ) : null}
          {transcript ? (
            <div className="flex flex-col gap-1 rounded-md border p-3">
              <p className="text-sm font-medium">{QUALIFY_VOICEMAIL_TRANSCRIPT_LABEL}</p>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {transcript}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="company-name">{QUALIFY_Q13_PROMPT}</Label>
        <Input
          id="company-name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company name (optional)"
        />
        <p className="text-muted-foreground text-xs">{QUALIFY_Q13_OPTIONAL_HINT}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="callback-phone">{QUALIFY_Q13_CALLBACK_PROMPT}</Label>
        <Input
          id="callback-phone"
          value={callbackPhone}
          onChange={(e) => setCallbackPhone(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-pitch">{QUALIFY_Q13_PITCH_PROMPT}</Label>
        <textarea
          id="product-pitch"
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          value={productPitch}
          onChange={(e) => setProductPitch(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <YesNoField
        legend={QUALIFY_Q14_PROMPT}
        value={hasAdditionalEvidence}
        onChange={setHasAdditionalEvidence}
      />

      {showUnverifiedWarning ? (
        <p className="text-muted-foreground text-sm" role="status">
          {COMPANY_NAME_UNVERIFIED_WARNING}
        </p>
      ) : null}

      {submitError ? (
        <p className="text-destructive text-sm" role="alert">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "Saving…" : "Save and continue"}
      </Button>
    </form>
  );
}

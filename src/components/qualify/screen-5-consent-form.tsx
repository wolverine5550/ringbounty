"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  QUALIFY_CONSENT_STEP_PREFACE,
  QUALIFY_EBR_EXPLAINER_MESSAGE,
  QUALIFY_Q1_PROMPT,
  QUALIFY_Q3_PROMPT,
} from "@/lib/constants/qualify-screen-1";
import { formatCompanyConsentPrompt } from "@/lib/qualify/format-company-consent-prompt";
import { buildQualifyPageHref } from "@/lib/qualify/qualify-step";
import type { QualifyScreen1Answers } from "@/lib/qualify/screen-1-consent";

export type Screen5ConsentFormProps = {
  claimSubjectId: string;
  claimId: string;
  companyName: string;
  initialAnswers?: QualifyScreen1Answers | null;
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
 * Step 5 — consent / EBR after the user has named the company (§7.2, reordered).
 */
export function Screen5ConsentForm({
  claimSubjectId,
  claimId,
  companyName,
  initialAnswers = null,
}: Screen5ConsentFormProps) {
  const router = useRouter();
  const [gaveDirectConsent, setGaveDirectConsent] = useState<boolean | null>(
    initialAnswers?.gaveDirectConsent ?? null,
  );
  const [hasExistingRelationship, setHasExistingRelationship] = useState<
    boolean | null
  >(initialAnswers?.hasExistingRelationship ?? null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ebrExplainerOpen, setEbrExplainerOpen] = useState(false);

  const q1Prompt = useMemo(
    () => formatCompanyConsentPrompt(QUALIFY_Q1_PROMPT, companyName),
    [companyName],
  );
  const q3Prompt = useMemo(
    () => formatCompanyConsentPrompt(QUALIFY_Q3_PROMPT, companyName),
    [companyName],
  );

  const canSubmit =
    gaveDirectConsent !== null && hasExistingRelationship !== null;

  const goToStep6 = () => {
    router.push(
      buildQualifyPageHref({
        claimSubjectId,
        claimId,
        step: 6,
      }),
    );
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setSubmitError("Please answer both questions.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/qualify/screen-1", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_subject_id: claimSubjectId,
          gave_direct_consent: gaveDirectConsent,
          third_party_consent_possible: false,
          has_existing_relationship: hasExistingRelationship,
        }),
      });

      const body = (await res.json()) as {
        error?: string;
        show_ebr_explainer?: boolean;
      };

      if (!res.ok) {
        setSubmitError(body.error ?? "Could not save your answers.");
        return;
      }

      if (body.show_ebr_explainer) {
        setEbrExplainerOpen(true);
        return;
      }

      goToStep6();
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form className="flex flex-col gap-6" onSubmit={(ev) => void handleSubmit(ev)}>
        <p className="text-muted-foreground text-sm">
          {QUALIFY_CONSENT_STEP_PREFACE}{" "}
          <span className="text-foreground font-medium">{companyName.trim()}</span>
        </p>
        <YesNoField
          legend={q1Prompt}
          value={gaveDirectConsent}
          onChange={setGaveDirectConsent}
        />
        <YesNoField
          legend={q3Prompt}
          value={hasExistingRelationship}
          onChange={setHasExistingRelationship}
        />

        {submitError ? (
          <p className="text-destructive text-sm" role="alert">
            {submitError}
          </p>
        ) : null}

        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? "Saving…" : "Save and continue"}
        </Button>
      </form>

      {ebrExplainerOpen ? (
        <EbrExplainerOverlay
          companyName={companyName}
          onContinue={() => {
            setEbrExplainerOpen(false);
            goToStep6();
          }}
        />
      ) : null}
    </>
  );
}

function EbrExplainerOverlay({
  companyName,
  onContinue,
}: {
  companyName: string;
  onContinue: () => void;
}) {
  return (
    <QualifyOverlay>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle id="ebr-explainer-title" className="text-lg">
            Relationship with {companyName.trim() || "this company"}
          </CardTitle>
          <CardDescription>{QUALIFY_EBR_EXPLAINER_MESSAGE}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={onContinue}>
            Continue to next step
          </Button>
        </CardContent>
      </Card>
    </QualifyOverlay>
  );
}

function QualifyOverlay({ children }: { children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
    >
      <div role="dialog" aria-modal="true" aria-labelledby="ebr-explainer-title">
        {children}
      </div>
    </div>
  );
}

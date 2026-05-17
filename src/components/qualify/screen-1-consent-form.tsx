"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  QUALIFY_EBR_EXPLAINER_MESSAGE,
  QUALIFY_Q1_PROMPT,
  QUALIFY_Q2_PROMPT,
  QUALIFY_Q3_PROMPT,
} from "@/lib/constants/qualify-screen-1";
import { buildQualifyPageHref } from "@/lib/qualify/qualify-step";
import type { QualifyScreen1Answers } from "@/lib/qualify/screen-1-consent";

export type Screen1ConsentFormProps = {
  claimSubjectId: string;
  claimId: string;
  initialAnswers?: QualifyScreen1Answers | null;
};

type YesNoFieldProps = {
  legend: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
};

/** Shared yes/no control for Q1–Q3. */
function YesNoField({ legend, value, onChange }: YesNoFieldProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">{legend}</legend>
      <YesNoButtons value={value} onChange={onChange} />
    </fieldset>
  );
}

function YesNoButtons({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
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
  );
}

/**
 * Phase 7.2 — Screen 1 consent / EBR questions (prd.md §9).
 */
export function Screen1ConsentForm({
  claimSubjectId,
  claimId,
  initialAnswers = null,
}: Screen1ConsentFormProps) {
  const router = useRouter();
  const [gaveDirectConsent, setGaveDirectConsent] = useState<boolean | null>(
    initialAnswers?.gaveDirectConsent ?? null,
  );
  const [thirdPartyConsentPossible, setThirdPartyConsentPossible] = useState<
    boolean | null
  >(initialAnswers?.thirdPartyConsentPossible ?? null);
  const [hasExistingRelationship, setHasExistingRelationship] = useState<
    boolean | null
  >(initialAnswers?.hasExistingRelationship ?? null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ebrExplainerOpen, setEbrExplainerOpen] = useState(false);

  const canSubmit =
    gaveDirectConsent !== null &&
    thirdPartyConsentPossible !== null &&
    hasExistingRelationship !== null;

  const goToStep2 = () => {
    router.push(
      buildQualifyPageHref({
        claimSubjectId,
        claimId,
        step: 2,
      }),
    );
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setSubmitError("Please answer all three questions.");
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
          third_party_consent_possible: thirdPartyConsentPossible,
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

      goToStep2();
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form className="flex flex-col gap-6" onSubmit={(ev) => void handleSubmit(ev)}>
        <YesNoField
          legend={QUALIFY_Q1_PROMPT}
          value={gaveDirectConsent}
          onChange={setGaveDirectConsent}
        />
        <YesNoField
          legend={QUALIFY_Q2_PROMPT}
          value={thirdPartyConsentPossible}
          onChange={setThirdPartyConsentPossible}
        />
        <YesNoField
          legend={QUALIFY_Q3_PROMPT}
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
          onContinue={() => {
            setEbrExplainerOpen(false);
            goToStep2();
          }}
        />
      ) : null}
    </>
  );
}

function EbrExplainerOverlay({ onContinue }: { onContinue: () => void }) {
  return (
    <QualifyOverlay>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle id="ebr-explainer-title" className="text-lg">
            Relationship with this company
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

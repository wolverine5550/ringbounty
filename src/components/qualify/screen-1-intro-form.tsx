"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  QUALIFY_STEP1_INTRO_BODY,
  QUALIFY_STEP1_INTRO_BULLETS,
  QUALIFY_STEP1_INTRO_CONTINUE_LABEL,
} from "@/lib/constants/qualify-screen-1-intro";
import { buildQualifyPageHref } from "@/lib/qualify/qualify-step";

export type Screen1IntroFormProps = {
  claimSubjectId: string;
  claimId: string;
};

/**
 * Screen 1 — orientation only. Consent/EBR questions run on step 5 after company ID.
 */
export function Screen1IntroForm({
  claimSubjectId,
  claimId,
}: Screen1IntroFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleContinue = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/qualify/screen-1-intro", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_id: claimId }),
      });

      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSubmitError(body.error ?? "Could not continue.");
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
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">{QUALIFY_STEP1_INTRO_BODY}</p>
      <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm">
        {QUALIFY_STEP1_INTRO_BULLETS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {submitError ? (
        <p className="text-destructive text-sm" role="alert">
          {submitError}
        </p>
      ) : null}
      <Button
        type="button"
        disabled={isSubmitting}
        onClick={() => void handleContinue()}
      >
        {isSubmitting ? "Continuing…" : QUALIFY_STEP1_INTRO_CONTINUE_LABEL}
      </Button>
    </div>
  );
}
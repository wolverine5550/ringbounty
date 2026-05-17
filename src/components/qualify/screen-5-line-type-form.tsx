"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  QUALIFY_LINE_TYPE_HELPER,
  QUALIFY_LINE_TYPE_OPTION_MOBILE,
  QUALIFY_LINE_TYPE_OPTION_RESIDENTIAL,
  QUALIFY_LINE_TYPE_PROMPT,
} from "@/lib/constants/qualify-screen-5";
import type { LineType } from "@/lib/tcpa/line-type-statute";
import type { QualifyScreen5Answers } from "@/lib/qualify/screen-5-line-type";

export type Screen5LineTypeFormProps = {
  claimSubjectId: string;
  claimId: string;
  initialAnswers?: QualifyScreen5Answers | null;
};

/**
 * Phase 7.6 — Screen 5 cell vs residential attestation (explicit user input only).
 */
export function Screen5LineTypeForm({
  claimSubjectId,
  claimId,
  initialAnswers = null,
}: Screen5LineTypeFormProps) {
  const router = useRouter();
  const [lineType, setLineType] = useState<LineType | null>(
    initialAnswers?.lineType ?? null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToResults = () => {
    router.push(`/results?claim=${claimId}`);
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineType) {
      setSubmitError("Please select mobile phone or home/landline.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/qualify/screen-5", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_subject_id: claimSubjectId,
          line_type: lineType,
        }),
      });

      const body = (await res.json()) as { error?: string };

      if (!res.ok) {
        setSubmitError(body.error ?? "Could not save your answer.");
        return;
      }

      goToResults();
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={(ev) => void handleSubmit(ev)}>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">{QUALIFY_LINE_TYPE_PROMPT}</legend>
        <p className="text-muted-foreground text-sm">{QUALIFY_LINE_TYPE_HELPER}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant={lineType === "mobile" ? "default" : "outline"}
            className="justify-start"
            onClick={() => setLineType("mobile")}
          >
            {QUALIFY_LINE_TYPE_OPTION_MOBILE}
          </Button>
          <Button
            type="button"
            variant={lineType === "residential" ? "default" : "outline"}
            className="justify-start"
            onClick={() => setLineType("residential")}
          >
            {QUALIFY_LINE_TYPE_OPTION_RESIDENTIAL}
          </Button>
        </div>
      </fieldset>

      {submitError ? (
        <p className="text-destructive text-sm" role="alert">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" disabled={!lineType || isSubmitting}>
        {isSubmitting ? "Saving…" : "Save and view results"}
      </Button>
    </form>
  );
}

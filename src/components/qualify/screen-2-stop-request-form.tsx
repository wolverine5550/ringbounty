"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  QUALIFY_Q4_PROMPT,
  QUALIFY_Q5_PROMPT,
  QUALIFY_Q6_PROMPT,
  QUALIFY_Q7_PROMPT,
  STOP_REQUEST_METHOD_OPTIONS,
  type StopRequestMethod,
} from "@/lib/constants/qualify-screen-2";
import { buildQualifyPageHref } from "@/lib/qualify/qualify-step";
import type { QualifyScreen2Answers } from "@/lib/qualify/screen-2-stop-request";

export type Screen2StopRequestFormProps = {
  claimSubjectId: string;
  claimId: string;
  initialAnswers?: QualifyScreen2Answers | null;
};

type YesNoFieldProps = {
  legend: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
};

/** Shared yes/no control for Q4 and Q7. */
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
 * Phase 7.3 — Screen 2 stop request / willful (prd.md §9).
 * Q4 branches: No skips Q5–Q7; Yes shows method, date, and post-stop calls.
 */
export function Screen2StopRequestForm({
  claimSubjectId,
  claimId,
  initialAnswers = null,
}: Screen2StopRequestFormProps) {
  const router = useRouter();
  const [stopRequestMade, setStopRequestMade] = useState<boolean | null>(
    initialAnswers?.stopRequestMade ?? null,
  );
  const [stopRequestMethod, setStopRequestMethod] = useState<StopRequestMethod | null>(
    initialAnswers?.stopRequestMethod ?? null,
  );
  const [stopRequestDate, setStopRequestDate] = useState(
    initialAnswers?.stopRequestDate ?? "",
  );
  const [callsAfterStopRequest, setCallsAfterStopRequest] = useState<boolean | null>(
    initialAnswers?.callsAfterStopRequest ?? null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showStopBranch = stopRequestMade === true;

  const canSubmit =
    stopRequestMade !== null &&
    (stopRequestMade === false ||
      (stopRequestMethod !== null &&
        stopRequestDate.trim() !== "" &&
        callsAfterStopRequest !== null));

  const goToStep3 = () => {
    router.push(
      buildQualifyPageHref({
        claimSubjectId,
        claimId,
        step: 3,
      }),
    );
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || stopRequestMade === null) {
      setSubmitError("Please answer all required questions.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload: Record<string, unknown> = {
      claim_subject_id: claimSubjectId,
      stop_request_made: stopRequestMade,
    };

    if (stopRequestMade) {
      payload.stop_request_method = stopRequestMethod;
      payload.stop_request_date = stopRequestDate.trim();
      payload.calls_after_stop_request = callsAfterStopRequest;
    }

    try {
      const res = await fetch("/api/qualify/screen-2", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await res.json()) as { error?: string };

      if (!res.ok) {
        setSubmitError(body.error ?? "Could not save your answers.");
        return;
      }

      goToStep3();
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={(ev) => void handleSubmit(ev)}>
      <YesNoField
        legend={QUALIFY_Q4_PROMPT}
        value={stopRequestMade}
        onChange={(value) => {
          setStopRequestMade(value);
          if (!value) {
            setStopRequestMethod(null);
            setStopRequestDate("");
            setCallsAfterStopRequest(null);
          }
        }}
      />

      {showStopBranch ? (
        <>
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium">{QUALIFY_Q5_PROMPT}</legend>
            <div className="flex flex-col gap-2">
              {STOP_REQUEST_METHOD_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={
                    stopRequestMethod === option.value ? "default" : "outline"
                  }
                  className="justify-start"
                  onClick={() => setStopRequestMethod(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="stop-request-date">{QUALIFY_Q6_PROMPT}</Label>
            <Input
              id="stop-request-date"
              type="date"
              value={stopRequestDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setStopRequestDate(e.target.value)}
            />
          </div>

          <YesNoField
            legend={QUALIFY_Q7_PROMPT}
            value={callsAfterStopRequest}
            onChange={setCallsAfterStopRequest}
          />
        </>
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

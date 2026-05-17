"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CALL_COUNT_TOTAL_BUCKETS,
  QUALIFY_Q10_PROMPT,
  QUALIFY_Q11_PROMPT,
  QUALIFY_Q12_COUNT_PROMPT,
  QUALIFY_Q12_PROMPT,
  QUALIFY_Q8_PROMPT,
  QUALIFY_Q9_PROMPT,
  type CallCountTotalBucket,
} from "@/lib/constants/qualify-screen-3";
import { buildQualifyPageHref } from "@/lib/qualify/qualify-step";
import type { QualifyScreen3Answers } from "@/lib/qualify/screen-3-call-details";

export type Screen3CallDetailsFormProps = {
  claimSubjectId: string;
  claimId: string;
  /** When Screen 2 Q4 was Yes — show Q9 post-stop count. */
  showPostStopCount: boolean;
  initialAnswers?: QualifyScreen3Answers | null;
};

type YesNoFieldProps = {
  legend: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
};

/** Shared yes/no control for Q11 and Q12. */
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
 * Phase 7.4 — Screen 3 call details (prd.md §5 claim_events keys).
 */
export function Screen3CallDetailsForm({
  claimSubjectId,
  claimId,
  showPostStopCount,
  initialAnswers = null,
}: Screen3CallDetailsFormProps) {
  const router = useRouter();
  const [callCountTotal, setCallCountTotal] = useState<CallCountTotalBucket | null>(
    initialAnswers?.callCountTotal ?? null,
  );
  const [callCountAfterStop, setCallCountAfterStop] = useState(
    initialAnswers?.callCountAfterStop != null
      ? String(initialAnswers.callCountAfterStop)
      : "",
  );
  const [mostRecentCallDate, setMostRecentCallDate] = useState(
    initialAnswers?.mostRecentCallDate ?? "",
  );
  const [callsBefore8am, setCallsBefore8am] = useState<boolean | null>(
    initialAnswers?.callsBefore8am ?? null,
  );
  const [callsAfter9pm, setCallsAfter9pm] = useState<boolean | null>(
    initialAnswers?.callsAfter9pm ?? null,
  );
  const [callsAfter9pmCount, setCallsAfter9pmCount] = useState(
    initialAnswers?.callsAfter9pmCount != null
      ? String(initialAnswers.callsAfter9pmCount)
      : "",
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showAfter9pmCount = callsAfter9pm === true;

  const canSubmit =
    callCountTotal !== null &&
    mostRecentCallDate.trim() !== "" &&
    callsBefore8am !== null &&
    callsAfter9pm !== null &&
    (!showPostStopCount || callCountAfterStop.trim() !== "") &&
    (!showAfter9pmCount || callsAfter9pmCount.trim() !== "");

  const goToStep4 = () => {
    router.push(
      buildQualifyPageHref({
        claimSubjectId,
        claimId,
        step: 4,
      }),
    );
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || callCountTotal === null) {
      setSubmitError("Please answer all required questions.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload: Record<string, unknown> = {
      claim_subject_id: claimSubjectId,
      call_count_total: callCountTotal,
      most_recent_call_date: mostRecentCallDate.trim(),
      calls_before_8am: callsBefore8am,
      calls_after_9pm: callsAfter9pm,
    };

    if (showPostStopCount) {
      payload.call_count_after_stop = Number(callCountAfterStop.trim());
    }

    if (showAfter9pmCount) {
      payload.calls_after_9pm_count = Number(callsAfter9pmCount.trim());
    }

    try {
      const res = await fetch("/api/qualify/screen-3", {
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

      goToStep4();
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={(ev) => void handleSubmit(ev)}>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">{QUALIFY_Q8_PROMPT}</legend>
        <div className="flex flex-col gap-2">
          {CALL_COUNT_TOTAL_BUCKETS.map((bucket) => (
            <Button
              key={bucket.value}
              type="button"
              variant={callCountTotal === bucket.value ? "default" : "outline"}
              className="justify-start"
              onClick={() => setCallCountTotal(bucket.value)}
            >
              {bucket.label}
            </Button>
          ))}
        </div>
      </fieldset>

      {showPostStopCount ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="call-count-after-stop">{QUALIFY_Q9_PROMPT}</Label>
          <Input
            id="call-count-after-stop"
            type="number"
            min={1}
            max={9999}
            inputMode="numeric"
            value={callCountAfterStop}
            onChange={(e) => setCallCountAfterStop(e.target.value)}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="most-recent-call-date">{QUALIFY_Q10_PROMPT}</Label>
        <Input
          id="most-recent-call-date"
          type="date"
          value={mostRecentCallDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setMostRecentCallDate(e.target.value)}
        />
      </div>

      <YesNoField
        legend={QUALIFY_Q11_PROMPT}
        value={callsBefore8am}
        onChange={setCallsBefore8am}
      />

      <YesNoField
        legend={QUALIFY_Q12_PROMPT}
        value={callsAfter9pm}
        onChange={(value) => {
          setCallsAfter9pm(value);
          if (!value) {
            setCallsAfter9pmCount("");
          }
        }}
      />

      {showAfter9pmCount ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="calls-after-9pm-count">{QUALIFY_Q12_COUNT_PROMPT}</Label>
          <Input
            id="calls-after-9pm-count"
            type="number"
            min={1}
            max={9999}
            inputMode="numeric"
            value={callsAfter9pmCount}
            onChange={(e) => setCallsAfter9pmCount(e.target.value)}
          />
        </div>
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

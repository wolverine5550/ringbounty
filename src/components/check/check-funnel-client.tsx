"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CheckStepIndicator } from "@/components/check/check-step-indicator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CHECK_FLOW_STEPS,
  CHECK_MAX_PHONE_ROWS,
  CHECK_STEP_ZERO_INTRO,
  RB_CHECK_SUBMITTED_EVENT,
  type CheckFlowStepId,
} from "@/lib/check/constants";
import { canContinueToNumberEntry } from "@/lib/check/evidence-checklist-gate";
import {
  CHECK_EVIDENCE_CHECKLIST_SUPPORT_COPY,
  EVIDENCE_CHECKLIST_ITEMS,
} from "@/lib/check/evidence-checklist-items";
import {
  extractUsPhoneDigits,
  formatUsPhoneMask,
  normalizeNanp10Key,
} from "@/lib/check/us-phone";
import { RATE_LIMIT_USER_MESSAGE } from "@/lib/rate-limit/constants";

const INITIAL_FUNNEL_STEP = 0 satisfies CheckFlowStepId;

type PhoneRow = {
  id: string;
  /** Up to 10 NANP digits (national number, no country code stored). */
  digits: string;
};

function buildInitialCheckedMap(): Record<string, boolean> {
  return Object.fromEntries(
    EVIDENCE_CHECKLIST_ITEMS.map((item) => [item.id, false]),
  );
}

function newEmptyPhoneRow(): PhoneRow {
  return { id: crypto.randomUUID(), digits: "" };
}

/** Rows that share the same completed NANP key (task_manager §4.3.3). */
function computeDuplicateRowIds(rows: PhoneRow[]): Set<string> {
  const byKey = new Map<string, string[]>();
  for (const row of rows) {
    const key = normalizeNanp10Key(row.digits);
    if (key === null) {
      continue;
    }
    const bucket = byKey.get(key) ?? [];
    bucket.push(row.id);
    byKey.set(key, bucket);
  }
  const dup = new Set<string>();
  for (const ids of byKey.values()) {
    if (ids.length > 1) {
      for (const id of ids) {
        dup.add(id);
      }
    }
  }
  return dup;
}

/**
 * Step 0 evidence checklist (§4.2), Step 1 masked US phone rows + submit (§4.3).
 */
export function CheckFunnelClient() {
  const [funnelStep, setFunnelStep] =
    useState<CheckFlowStepId>(INITIAL_FUNNEL_STEP);
  const [checkedMap, setCheckedMap] = useState(buildInitialCheckedMap);
  const [continueAnyway, setContinueAnyway] = useState(false);
  const [phoneRows, setPhoneRows] = useState<PhoneRow[]>(() => [
    newEmptyPhoneRow(),
  ]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [checkSubmitting, setCheckSubmitting] = useState(false);
  const stepOneRef = useRef<HTMLElement | null>(null);

  const duplicateRowIds = useMemo(
    () => computeDuplicateRowIds(phoneRows),
    [phoneRows],
  );

  const checkedCount = EVIDENCE_CHECKLIST_ITEMS.filter(
    (item) => checkedMap[item.id],
  ).length;

  const canContinue = canContinueToNumberEntry(
    checkedCount,
    EVIDENCE_CHECKLIST_ITEMS.length,
    continueAnyway,
  );

  const toggleItem = useCallback((id: string, checked: boolean) => {
    setCheckedMap((prev) => ({ ...prev, [id]: checked }));
  }, []);

  const handleContinue = useCallback(() => {
    setFunnelStep(1);
  }, []);

  const changeRowDigits = useCallback((rowId: string, raw: string) => {
    setSubmitError(null);
    const digits = extractUsPhoneDigits(raw).slice(0, 10);
    setPhoneRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, digits } : row)),
    );
  }, []);

  const addPhoneRow = useCallback(() => {
    setPhoneRows((prev) =>
      prev.length >= CHECK_MAX_PHONE_ROWS
        ? prev
        : [...prev, newEmptyPhoneRow()],
    );
  }, []);

  const removePhoneRow = useCallback((rowId: string) => {
    setPhoneRows((prev) => {
      if (prev.length <= 1) {
        const only = prev[0];
        if (!only) {
          return [newEmptyPhoneRow()];
        }
        return [{ id: only.id, digits: "" }];
      }
      return prev.filter((r) => r.id !== rowId);
    });
  }, []);

  const runCheckSubmit = useCallback(async () => {
    setSubmitError(null);
    setRateLimitMessage(null);

    const normalized = phoneRows
      .map((r) => normalizeNanp10Key(r.digits))
      .filter((k): k is string => k !== null);

    if (normalized.length === 0) {
      setSubmitError(
        "Enter at least one complete U.S. phone number (10 digits).",
      );
      return;
    }

    if (duplicateRowIds.size > 0) {
      setSubmitError(
        "Remove or change duplicate numbers before running the check.",
      );
      return;
    }

    const unique = new Set(normalized);
    if (unique.size !== normalized.length) {
      setSubmitError("Duplicate numbers detected.");
      return;
    }

    setCheckSubmitting(true);
    try {
      const res = await fetch("/api/check/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_numbers: normalized }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };

      if (res.status === 429) {
        setRateLimitMessage(body.error ?? RATE_LIMIT_USER_MESSAGE);
        return;
      }

      if (!res.ok) {
        setSubmitError(
          body.error ?? `Check request failed (${String(res.status)}).`,
        );
        return;
      }

      window.dispatchEvent(new Event(RB_CHECK_SUBMITTED_EVENT));
    } catch {
      setSubmitError("Could not run check. Please try again.");
    } finally {
      setCheckSubmitting(false);
    }
  }, [duplicateRowIds.size, phoneRows]);

  useEffect(() => {
    if (funnelStep !== 1) {
      return;
    }
    const node = stepOneRef.current;
    if (!node) {
      return;
    }
    node.focus({ preventScroll: true });
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [funnelStep]);

  const stepZeroMeta = CHECK_FLOW_STEPS[0];
  const stepOneMeta = CHECK_FLOW_STEPS[1];

  return (
    <>
      <CheckStepIndicator currentStep={funnelStep} />

      <section
        aria-labelledby="check-step-0-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <h2
            id="check-step-0-heading"
            className="text-lg font-semibold tracking-tight"
          >
            {stepZeroMeta.heading}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {CHECK_STEP_ZERO_INTRO}
          </p>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">
          {CHECK_EVIDENCE_CHECKLIST_SUPPORT_COPY}
        </p>

        <fieldset className="bg-card/40 flex flex-col gap-3 rounded-lg border border-border p-4">
          <legend className="sr-only">Evidence preservation checklist</legend>
          <ul className="flex flex-col gap-3">
            {EVIDENCE_CHECKLIST_ITEMS.map((item) => {
              const inputId = `evidence-check-${item.id}`;
              return (
                <li key={item.id} className="flex gap-3">
                  <Checkbox
                    id={inputId}
                    checked={checkedMap[item.id] ?? false}
                    onCheckedChange={(value) =>
                      toggleItem(item.id, value === true)
                    }
                  />
                  <Label
                    htmlFor={inputId}
                    className="text-muted-foreground cursor-pointer text-sm font-normal leading-snug"
                  >
                    {item.label}
                  </Label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div className="bg-muted/15 flex gap-3 rounded-lg border border-dashed border-border p-4">
          <Checkbox
            id="evidence-checklist-continue-anyway"
            checked={continueAnyway}
            onCheckedChange={(value) => setContinueAnyway(value === true)}
          />
          <Label
            htmlFor="evidence-checklist-continue-anyway"
            className="text-muted-foreground cursor-pointer text-sm font-normal leading-snug"
          >
            I understand I have not finished every checklist item above and
            still want to continue to enter numbers.
          </Label>
        </div>

        <Button type="button" disabled={!canContinue} onClick={handleContinue}>
          Continue to enter numbers
        </Button>

        {funnelStep >= 1 ? (
          <section
            ref={stepOneRef}
            id="check-step-1-numbers"
            tabIndex={-1}
            aria-labelledby="check-step-1-heading"
            className="flex flex-col gap-4 rounded-lg border border-border bg-muted/10 p-4 outline-none"
          >
            <div className="flex flex-col gap-2">
              <h2
                id="check-step-1-heading"
                className="text-lg font-semibold tracking-tight"
              >
                {stepOneMeta.heading}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                U.S. numbers only. Formatting is added as you type; we send
                digits-only to the server.
              </p>
            </div>

            <ul className="flex flex-col gap-3">
              {phoneRows.map((row, index) => {
                const dup = duplicateRowIds.has(row.id);
                const inputId = `check-phone-${row.id}`;
                return (
                  <li key={row.id} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-2">
                    <div className="min-w-0 flex-1">
                      <Label htmlFor={inputId} className="sr-only">
                        Phone number {index + 1}
                      </Label>
                      <Input
                        id={inputId}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="(555) 555-5555"
                        aria-invalid={dup}
                        value={formatUsPhoneMask(row.digits)}
                        onChange={(e) => changeRowDigits(row.id, e.target.value)}
                        className="font-mono"
                      />
                      {dup ? (
                        <p className="text-destructive mt-1 text-xs" role="alert">
                          Duplicate number — change or remove this row.
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 self-stretch sm:mt-0"
                      disabled={phoneRows.length <= 1}
                      onClick={() => removePhoneRow(row.id)}
                    >
                      Remove
                    </Button>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={phoneRows.length >= CHECK_MAX_PHONE_ROWS}
                onClick={addPhoneRow}
              >
                Add number
              </Button>
              <p className="text-muted-foreground text-xs">
                Up to {String(CHECK_MAX_PHONE_ROWS)} numbers per check.
              </p>
            </div>

            {rateLimitMessage ? (
              <p className="text-warning text-sm" role="alert">
                {rateLimitMessage}
              </p>
            ) : null}

            {submitError ? (
              <p className="text-destructive text-sm" role="alert">
                {submitError}
              </p>
            ) : null}

            <Button
              type="button"
              disabled={
                checkSubmitting ||
                duplicateRowIds.size > 0 ||
                !phoneRows.some((r) => normalizeNanp10Key(r.digits) !== null)
              }
              onClick={() => void runCheckSubmit()}
            >
              {checkSubmitting ? "Running check…" : "Run check"}
            </Button>
          </section>
        ) : null}
      </section>
    </>
  );
}

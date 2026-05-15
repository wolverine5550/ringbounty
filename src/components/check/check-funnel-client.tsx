"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CheckStepIndicator } from "@/components/check/check-step-indicator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  CHECK_FLOW_STEPS,
  CHECK_STEP_ZERO_INTRO,
  type CheckFlowStepId,
} from "@/lib/check/constants";
import { canContinueToNumberEntry } from "@/lib/check/evidence-checklist-gate";
import {
  CHECK_EVIDENCE_CHECKLIST_SUPPORT_COPY,
  EVIDENCE_CHECKLIST_ITEMS,
} from "@/lib/check/evidence-checklist-items";

const INITIAL_FUNNEL_STEP = 0 satisfies CheckFlowStepId;

function buildInitialCheckedMap(): Record<string, boolean> {
  return Object.fromEntries(
    EVIDENCE_CHECKLIST_ITEMS.map((item) => [item.id, false]),
  );
}

/**
 * Step 0 checklist + gating (§4.2) and reveal of Step 1 placeholder until §4.3 ships.
 */
export function CheckFunnelClient() {
  const [funnelStep, setFunnelStep] =
    useState<CheckFlowStepId>(INITIAL_FUNNEL_STEP);
  const [checkedMap, setCheckedMap] = useState(buildInitialCheckedMap);
  const [continueAnyway, setContinueAnyway] = useState(false);
  const stepOneRef = useRef<HTMLElement | null>(null);

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
            className="flex flex-col gap-2 rounded-lg border border-border bg-muted/10 p-4 outline-none"
          >
            <h2
              id="check-step-1-heading"
              className="text-lg font-semibold tracking-tight"
            >
              {stepOneMeta.heading}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Phone number inputs and validation ship in §4.3 — use your browser
              back button if you need to revisit the checklist above.
            </p>
          </section>
        ) : null}
      </section>
    </>
  );
}

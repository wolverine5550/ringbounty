"use client";

import { useEffect, useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { canProceedPastEvidenceChecklist } from "@/lib/check/evidence-checklist-gate";
import {
  CHECK_EVIDENCE_CHECKLIST_SUPPORT_COPY,
  EVIDENCE_CHECKLIST_ITEMS,
  EVIDENCE_PRESERVATION_CONTINUE_ANYWAY_LABEL,
  EVIDENCE_PRESERVATION_HEADLINE,
  EVIDENCE_PRESERVATION_INTRO,
} from "@/lib/check/evidence-checklist-items";

type EvidencePreservationChecklistProps = {
  /** Notifies parent when user may proceed (all checked or continue-anyway). */
  onCanProceedChange: (canProceed: boolean) => void;
};

function buildInitialCheckedMap(): Record<string, boolean> {
  return Object.fromEntries(
    EVIDENCE_CHECKLIST_ITEMS.map((item) => [item.id, false]),
  );
}

/**
 * PRD §10 checklist — gate before attorney referral on `/attorney-connect`.
 */
export function EvidencePreservationChecklist({
  onCanProceedChange,
}: EvidencePreservationChecklistProps) {
  const [checkedMap, setCheckedMap] = useState(buildInitialCheckedMap);
  const [continueAnyway, setContinueAnyway] = useState(false);

  const checkedCount = EVIDENCE_CHECKLIST_ITEMS.filter(
    (item) => checkedMap[item.id],
  ).length;

  const canProceed = useMemo(
    () =>
      canProceedPastEvidenceChecklist(
        checkedCount,
        EVIDENCE_CHECKLIST_ITEMS.length,
        continueAnyway,
      ),
    [checkedCount, continueAnyway],
  );

  useEffect(() => {
    onCanProceedChange(canProceed);
  }, [canProceed, onCanProceedChange]);

  return (
    <section
      className="flex flex-col gap-4"
      aria-labelledby="evidence-preservation-heading"
    >
      <div className="flex flex-col gap-2">
        <h2
          id="evidence-preservation-heading"
          className="text-lg font-semibold tracking-tight"
        >
          {EVIDENCE_PRESERVATION_HEADLINE}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {EVIDENCE_PRESERVATION_INTRO}
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
                    setCheckedMap((prev) => ({
                      ...prev,
                      [item.id]: value === true,
                    }))
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
          {EVIDENCE_PRESERVATION_CONTINUE_ANYWAY_LABEL}
        </Label>
      </div>
    </section>
  );
}

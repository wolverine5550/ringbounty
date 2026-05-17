import Link from "next/link";

import { Screen1ConsentForm } from "@/components/qualify/screen-1-consent-form";
import {
  QUALIFY_STEP_TITLES,
  QUALIFY_WIZARD_STEP_MAX,
  type QualifyWizardStep,
} from "@/lib/qualify/constants";
import { buildQualifyPageHref } from "@/lib/qualify/qualify-step";
import type { QualifyScreen1Answers } from "@/lib/qualify/screen-1-consent";

export type QualifyWizardShellProps = {
  claimSubjectId: string;
  claimId: string;
  step: QualifyWizardStep;
  /** Loaded from `claim_events` when step is 1 (§7.2). */
  screen1Initial?: QualifyScreen1Answers | null;
};

/**
 * Phase 7.1 — Step chrome until §7.2–7.5 screens ship.
 */
export function QualifyWizardShell({
  claimSubjectId,
  claimId,
  step,
  screen1Initial = null,
}: QualifyWizardShellProps) {
  const title = QUALIFY_STEP_TITLES[step];
  const prevStep = step > 1 ? ((step - 1) as QualifyWizardStep) : null;
  const nextStep =
    step < QUALIFY_WIZARD_STEP_MAX ? ((step + 1) as QualifyWizardStep) : null;

  return (
    <section className="flex flex-col gap-4 rounded-lg border p-6">
      <p className="text-muted-foreground text-sm">
        Step {step} of {QUALIFY_WIZARD_STEP_MAX}
      </p>
      <h2 className="text-lg font-semibold">{title}</h2>
      {step === 1 ? (
        <Screen1ConsentForm
          claimSubjectId={claimSubjectId}
          claimId={claimId}
          initialAnswers={screen1Initial}
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          Question forms for this screen ship in Phase 7.{step + 1}. Your progress
          is tracked in the URL (<code className="text-xs">?step={step}</code>)
          and can resume from saved claim events.
        </p>
      )}
      <nav
        className="flex flex-wrap gap-3 pt-2"
        aria-label="Qualification step navigation"
      >
        {prevStep ? (
          <Link
            className="text-primary text-sm underline underline-offset-2"
            href={buildQualifyPageHref({
              claimSubjectId,
              claimId,
              step: prevStep,
            })}
          >
            Previous step
          </Link>
        ) : null}
        {nextStep && step !== 1 ? (
          <Link
            className="text-primary text-sm underline underline-offset-2"
            href={buildQualifyPageHref({
              claimSubjectId,
              claimId,
              step: nextStep,
            })}
          >
            Next step (preview)
          </Link>
        ) : null}
        {!nextStep ? (
          <span className="text-muted-foreground text-sm">
            Final wizard step — results and attorney referral ship in Phase 8 /
            13.
          </span>
        ) : null}
      </nav>
    </section>
  );
}

import Link from "next/link";

import { Screen1ConsentForm } from "@/components/qualify/screen-1-consent-form";
import { Screen2StopRequestForm } from "@/components/qualify/screen-2-stop-request-form";
import { Screen3CallDetailsForm } from "@/components/qualify/screen-3-call-details-form";
import { Screen4CompanyForm } from "@/components/qualify/screen-4-company-form";
import {
  QUALIFY_STEP_TITLES,
  QUALIFY_WIZARD_STEP_MAX,
  type QualifyWizardStep,
} from "@/lib/qualify/constants";
import { buildQualifyPageHref } from "@/lib/qualify/qualify-step";
import type { QualifyScreen1Answers } from "@/lib/qualify/screen-1-consent";
import type { QualifyScreen2Answers } from "@/lib/qualify/screen-2-stop-request";
import type { QualifyScreen3Answers } from "@/lib/qualify/screen-3-call-details";
import type { QualifyScreen4Answers } from "@/lib/qualify/screen-4-company-identification";

export type QualifyWizardShellProps = {
  claimSubjectId: string;
  claimId: string;
  step: QualifyWizardStep;
  /** Loaded from `claim_events` when step is 1 (§7.2). */
  screen1Initial?: QualifyScreen1Answers | null;
  /** Loaded from `claim_events` when step is 2 (§7.3). */
  screen2Initial?: QualifyScreen2Answers | null;
  /** Loaded from `claim_events` when step is 3 (§7.4). */
  screen3Initial?: QualifyScreen3Answers | null;
  /** When Screen 2 stop request was made — show Q9 on step 3. */
  showPostStopCount?: boolean;
  /** Loaded from `claim_events` when step is 4 (§7.5). */
  screen4Initial?: QualifyScreen4Answers | null;
  /** Subject column fallback for Q13 company name. */
  subjectCompanyName?: string | null;
};

/**
 * Phase 7.1 — Step chrome until §7.2–7.5 screens ship.
 */
export function QualifyWizardShell({
  claimSubjectId,
  claimId,
  step,
  screen1Initial = null,
  screen2Initial = null,
  screen3Initial = null,
  showPostStopCount = false,
  screen4Initial = null,
  subjectCompanyName = null,
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
      ) : step === 2 ? (
        <Screen2StopRequestForm
          claimSubjectId={claimSubjectId}
          claimId={claimId}
          initialAnswers={screen2Initial}
        />
      ) : step === 3 ? (
        <Screen3CallDetailsForm
          claimSubjectId={claimSubjectId}
          claimId={claimId}
          showPostStopCount={showPostStopCount}
          initialAnswers={screen3Initial}
        />
      ) : step === 4 ? (
        <Screen4CompanyForm
          claimSubjectId={claimSubjectId}
          claimId={claimId}
          initialAnswers={screen4Initial}
          initialCompanyName={subjectCompanyName}
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
        {nextStep && step !== 1 && step !== 2 && step !== 3 && step !== 4 ? (
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

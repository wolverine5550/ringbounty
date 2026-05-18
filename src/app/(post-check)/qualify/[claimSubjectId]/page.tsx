import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { PostCheckPageFallback } from "@/components/post-check/post-check-page-fallback";
import { FederalDncAttestationForm } from "@/components/qualify/federal-dnc-attestation-form";
import { QualifyWizardShell } from "@/components/qualify/qualify-wizard-shell";
import { StateDncComingSoon } from "@/components/qualify/state-dnc-coming-soon";
import { enforcePostCheckAccess } from "@/lib/claims/enforce-post-check-access";
import { buildLoginHrefForClaim } from "@/lib/claims/gated-routes";
import { getFederalDncScreenshotPathFromMetadata } from "@/lib/dnc/federal-dnc-evidence";
import {
  deriveStateDncScaffoldFields,
  getApplicableStateDncCode,
} from "@/lib/dnc/scaffold-state-dnc-row";
import {
  claimQueryMatchesSubject,
  loadQualifyPageContext,
} from "@/lib/qualify/load-qualify-context";
import {
  buildQualifyPageHref,
  isFederalDncAttestationComplete,
  loadQualifyResumeStep,
  parseQualifyStepFromQuery,
  resolveQualifyWizardStep,
} from "@/lib/qualify/qualify-step";
import { loadQualifyScreen1Answers } from "@/lib/qualify/screen-1-consent";
import { loadQualifyScreen2Answers } from "@/lib/qualify/screen-2-stop-request";
import { loadQualifyScreen3Answers } from "@/lib/qualify/screen-3-call-details";
import { loadQualifyScreen4Answers } from "@/lib/qualify/screen-4-company-identification";
import { loadQualifyScreen5Answers } from "@/lib/qualify/screen-5-line-type";
import { createClient } from "@/lib/supabase/server";

type QualifyPageProps = {
  params: Promise<{ claimSubjectId: string }>;
  searchParams: Promise<{ claim?: string; step?: string }>;
};

/**
 * Qualify entry — §7.1 routing: federal DNC pre-gate, then wizard screens 1–5 via `?step=`.
 * Sync shell — runtime access runs inside `<Suspense>` (Next.js 16 Cache Components).
 */
export default function QualifyPage({ params, searchParams }: QualifyPageProps) {
  return (
    <Suspense fallback={<PostCheckPageFallback />}>
      <QualifyPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function QualifyPageContent({
  params,
  searchParams,
}: QualifyPageProps) {
  const { claimSubjectId } = await params;
  const { claim: claimIdFromQuery, step: stepRaw } = await searchParams;
  const returnPath = buildQualifyPageHref({
    claimSubjectId,
    step: parseQualifyStepFromQuery(stepRaw) ?? undefined,
    claimId: claimIdFromQuery,
  });

  await enforcePostCheckAccess({
    returnPath,
    claimIdFromQuery: claimIdFromQuery ?? null,
  });

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(
      buildLoginHrefForClaim({
        returnPath,
        claimId: claimIdFromQuery ?? "",
      }),
    );
  }

  const pageContext = await loadQualifyPageContext(supabase, {
    claimSubjectId,
    userId: user.id,
  });

  if (!pageContext) {
    notFound();
  }

  if (
    !claimQueryMatchesSubject(claimIdFromQuery, pageContext.subject.claim_id)
  ) {
    notFound();
  }

  const claimId = pageContext.claim.id;

  const { data: dncRow } = await supabase
    .from("dnc_check_results")
    .select(
      "federal_dnc_registered, federal_dnc_registration_date, state_dnc_applicable, state_dnc_state",
    )
    .eq("claim_subject_id", pageContext.subject.id)
    .maybeSingle();

  const federalDncComplete = isFederalDncAttestationComplete(
    dncRow?.federal_dnc_registered,
  );

  const urlStep = parseQualifyStepFromQuery(stepRaw);
  if (stepRaw !== undefined && stepRaw !== "" && urlStep === null) {
    notFound();
  }

  if (federalDncComplete && urlStep === null) {
    redirect(
      buildQualifyPageHref({
        claimSubjectId: pageContext.subject.id,
        step: 1,
        claimId,
      }),
    );
  }

  let applicableStateCode = getApplicableStateDncCode({
    state_dnc_applicable: dncRow?.state_dnc_applicable ?? null,
    state_dnc_registered: null,
    state_dnc_state: dncRow?.state_dnc_state ?? null,
    state_dnc_checked_at: null,
  });

  if (!applicableStateCode) {
    const { data: profile } = await supabase
      .from("users")
      .select("state")
      .eq("id", user.id)
      .maybeSingle();
    applicableStateCode = getApplicableStateDncCode(
      deriveStateDncScaffoldFields(profile?.state),
    );
  }

  if (!federalDncComplete) {
    return (
      <QualifyPageLayout
        title="National Do Not Call Registry"
        subtitle="Before the qualification wizard — confirm your registry status (Phase 6.2)."
      >
        {applicableStateCode ? (
          <StateDncComingSoon stateCode={applicableStateCode} />
        ) : null}
        <FederalDncAttestationForm
          claimSubjectId={pageContext.subject.id}
          phoneDisplay={pageContext.subject.phone_number}
          initialRegistered={dncRow?.federal_dnc_registered ?? null}
          initialRegistrationDate={
            dncRow?.federal_dnc_registration_date ?? null
          }
          initialScreenshotPath={getFederalDncScreenshotPathFromMetadata(
            pageContext.subject.metadata,
          )}
        />
      </QualifyPageLayout>
    );
  }

  const resumeStep = await loadQualifyResumeStep(supabase, claimId);
  const wizardStep = resolveQualifyWizardStep({ urlStep, resumeStep });
  const screen2Answers =
    wizardStep === 2 ||
    wizardStep === 3 ||
    wizardStep === 4 ||
    wizardStep === 5 ||
    wizardStep === 6
      ? await loadQualifyScreen2Answers(supabase, claimId)
      : null;
  const screen2Initial = wizardStep === 2 ? screen2Answers : null;
  const screen3Initial =
    wizardStep === 3 ? await loadQualifyScreen3Answers(supabase, claimId) : null;
  const showPostStopCount =
    wizardStep === 3 && screen2Answers?.stopRequestMade === true;
  const screen4Initial =
    wizardStep === 4
      ? await loadQualifyScreen4Answers(
          supabase,
          claimId,
          pageContext.subject.company_name,
        )
      : null;
  const screen5ConsentInitial =
    wizardStep === 5 ? await loadQualifyScreen1Answers(supabase, claimId) : null;
  const screen6LineInitial =
    wizardStep === 6 ? await loadQualifyScreen5Answers(supabase, claimId) : null;

  const companyNameForConsent =
    pageContext.subject.company_name?.trim() ?? "";

  if (wizardStep === 5 && companyNameForConsent.length < 2) {
    redirect(
      buildQualifyPageHref({
        claimSubjectId: pageContext.subject.id,
        step: 4,
        claimId,
      }),
    );
  }

  return (
    <QualifyPageLayout
      title="Qualify your claim"
      subtitle={`Screen ${wizardStep} of 6 — answer questions about this number.`}
    >
      {applicableStateCode ? (
        <StateDncComingSoon stateCode={applicableStateCode} />
      ) : null}
      <QualifyWizardShell
        claimSubjectId={pageContext.subject.id}
        claimId={claimId}
        step={wizardStep}
        screen2Initial={screen2Initial}
        screen3Initial={screen3Initial}
        showPostStopCount={showPostStopCount}
        screen4Initial={screen4Initial}
        subjectCompanyName={pageContext.subject.company_name}
        screen5ConsentInitial={screen5ConsentInitial}
        screen5Initial={screen6LineInitial}
      />
    </QualifyPageLayout>
  );
}

function QualifyPageLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

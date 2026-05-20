import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { PostCheckPageFallback } from "@/components/post-check/post-check-page-fallback";
import { FederalDncAttestationGate } from "@/components/qualify/federal-dnc-attestation-gate";
import { QualifyWizardShell } from "@/components/qualify/qualify-wizard-shell";
import { StateDncComingSoon } from "@/components/qualify/state-dnc-coming-soon";
import { enforcePostCheckAccess } from "@/lib/claims/enforce-post-check-access";
import { buildLoginHrefForClaim } from "@/lib/claims/gated-routes";
import { getFederalDncScreenshotPathFromMetadata } from "@/lib/dnc/federal-dnc-evidence";
import { loadPriorFederalDncAttestationForUser } from "@/lib/dnc/load-prior-federal-dnc-attestation";
import {
  deriveStateDncScaffoldFields,
  getApplicableStateDncCode,
} from "@/lib/dnc/scaffold-state-dnc-row";
import {
  claimQueryMatchesSubject,
  loadQualifyPageContext,
} from "@/lib/qualify/load-qualify-context";
import {
  formatQualifyEvaluatedCallerDisplay,
  QUALIFY_EVALUATED_CALLER_LABEL,
} from "@/lib/qualify/constants";
import {
  buildQualifyPageHref,
  isFederalDncAttestationComplete,
  loadQualifyResumeStep,
  parseQualifyStepFromQuery,
  resolveQualifyWizardStep,
} from "@/lib/qualify/qualify-step";
import { isNamedCompanyForConsent } from "@/lib/qualify/format-company-consent-prompt";
import { loadQualifyScreen1Answers } from "@/lib/qualify/screen-1-consent";
import { loadQualifyScreen2Answers } from "@/lib/qualify/screen-2-stop-request";
import { loadQualifyScreen3Answers } from "@/lib/qualify/screen-3-call-details";
import { loadQualifyCompanyIntelSnapshot } from "@/lib/qualify/load-qualify-company-intel";
import { loadQualifyScreen4Answers } from "@/lib/qualify/screen-4-company-identification";
import { loadQualifyScreen5Answers } from "@/lib/qualify/screen-5-line-type";
import { createClient } from "@/lib/supabase/server";
import { loadUserReceivingPhone } from "@/lib/users/receiving-phone";

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
  const evaluatedCallerDisplay = formatQualifyEvaluatedCallerDisplay(
    pageContext.subject.phone_number,
    pageContext.subject.phone_number_normalized,
  );

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
    const [priorAttestation, savedReceivingPhone] = await Promise.all([
      loadPriorFederalDncAttestationForUser(supabase, {
        userId: user.id,
        excludeClaimSubjectId: pageContext.subject.id,
      }),
      loadUserReceivingPhone(supabase, user.id),
    ]);

    return (
      <QualifyPageLayout
        title="National Do Not Call Registry"
        evaluatedCallerDisplay={evaluatedCallerDisplay}
      >
        {applicableStateCode ? (
          <StateDncComingSoon stateCode={applicableStateCode} />
        ) : null}
        <FederalDncAttestationGate
          claimSubjectId={pageContext.subject.id}
          claimId={claimId}
          hasPriorAttestationForPhone={priorAttestation !== null}
          savedReceivingPhoneDisplay={savedReceivingPhone?.display ?? null}
          screenedCallerDisplay={pageContext.subject.phone_number}
          initialReceivingPhoneDisplay={savedReceivingPhone?.display ?? null}
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
  const screen4IntelSnapshot =
    wizardStep === 4
      ? await loadQualifyCompanyIntelSnapshot(supabase, {
          claimSubjectId: pageContext.subject.id,
          userId: user.id,
        })
      : null;
  const screen5ConsentInitial =
    wizardStep === 5 ? await loadQualifyScreen1Answers(supabase, claimId) : null;
  const screen6LineInitial =
    wizardStep === 6 ? await loadQualifyScreen5Answers(supabase, claimId) : null;

  const companyNameForConsent =
    pageContext.subject.company_name?.trim() ?? "";

  if (wizardStep === 5 && !isNamedCompanyForConsent(companyNameForConsent)) {
    redirect(
      buildQualifyPageHref({
        claimSubjectId: pageContext.subject.id,
        step: 6,
        claimId,
      }),
    );
  }

  return (
    <QualifyPageLayout
      title="Qualify your claim"
      evaluatedCallerDisplay={evaluatedCallerDisplay}
      subtitle={`Screen ${wizardStep} of 6 — answer questions about this caller.`}
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
        subjectCompanyIdentified={pageContext.subject.company_identified}
        screen4IntelSnapshot={screen4IntelSnapshot}
        screen5ConsentInitial={screen5ConsentInitial}
        screen5Initial={screen6LineInitial}
      />
    </QualifyPageLayout>
  );
}

function QualifyPageLayout({
  title,
  evaluatedCallerDisplay,
  subtitle,
  children,
}: {
  title: string;
  evaluatedCallerDisplay?: string | null;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {evaluatedCallerDisplay ? (
          <p className="text-sm">
            <span className="text-muted-foreground">
              {QUALIFY_EVALUATED_CALLER_LABEL}{" "}
            </span>
            <span className="font-medium">{evaluatedCallerDisplay}</span>
          </p>
        ) : null}
        {subtitle ? (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

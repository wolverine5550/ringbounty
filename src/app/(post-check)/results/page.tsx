import type { Metadata } from "next";
import { Suspense } from "react";

import { PostCheckPageFallback } from "@/components/post-check/post-check-page-fallback";
import { AttorneyLeadStatusPanel } from "@/components/results/attorney-lead-status-panel";
import { FirmContactDisputeForm } from "@/components/results/firm-contact-dispute-form";
import { AttorneyReferralCta } from "@/components/results/attorney-referral-cta";
import { QualifyContinuationCta } from "@/components/results/qualify-continuation-cta";
import { EmailCaptureModal } from "@/components/email-capture-modal";
import { ResultsIneligiblePanel } from "@/components/results/results-ineligible-panel";
import { ResultsStrengthAndSubjects } from "@/components/results/results-strength-and-subjects";
import { ResultsValuationPanel } from "@/components/results/results-valuation-panel";
import { SolWarningBanner } from "@/components/results/sol-warning-banner";
import { enforcePostCheckAccess } from "@/lib/claims/enforce-post-check-access";
import { loadResultsPageContext } from "@/lib/claims/load-results-page-context";
import { loadFirmContactDisputeSubmitted } from "@/lib/leads/load-firm-contact-dispute-submitted";
import { loadConsumerLeadStatus } from "@/lib/leads/load-consumer-lead-status";
import { canReportFirmContactIssue } from "@/lib/leads/record-firm-contact-dispute";
import { RESULTS_PATH } from "@/lib/claims/gated-routes";
import { buildCanonicalMetadata } from "@/lib/seo/canonical-metadata";
import { createClient } from "@/lib/supabase/server";

type ResultsPageProps = {
  searchParams: Promise<{ claim?: string }>;
};

/** Canonical `/results` without `?claim=` query variants (§11.4.3). */
export function generateMetadata(): Metadata {
  return buildCanonicalMetadata({
    pathname: RESULTS_PATH,
    title: "Your results",
    noIndex: true,
  });
}

/**
 * Post-qualify results (Phase 7.7 / 8.4). Strength, valuation, and attorney CTA.
 * Sync shell — runtime access runs inside `<Suspense>` (Next.js 16 Cache Components).
 */
export default function ResultsPage({ searchParams }: ResultsPageProps) {
  return (
    <Suspense fallback={<PostCheckPageFallback />}>
      <ResultsPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResultsPageContent({ searchParams }: ResultsPageProps) {
  const { claim: claimId } = await searchParams;
  await enforcePostCheckAccess({
    returnPath: RESULTS_PATH,
    claimIdFromQuery: claimId ?? null,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [results, consumerLead, firmContactDisputeSubmitted] =
    claimId && user?.id
      ? await (async () => {
          const [pageResults, lead] = await Promise.all([
            loadResultsPageContext(supabase, {
              claimId,
              userId: user.id,
            }),
            loadConsumerLeadStatus(supabase, { claimId, userId: user.id }),
          ]);
          const disputeSubmitted = lead
            ? await loadFirmContactDisputeSubmitted(supabase, {
                claimId: lead.claimId,
                leadId: lead.leadId,
              })
            : false;
          return [pageResults, lead, disputeSubmitted] as const;
        })()
      : [null, null, false];

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Your results
        </h1>
        <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
          {results?.effectiveClaimStrength === "ineligible"
            ? "Informational claim strength based on your qualification answers. This is not legal advice."
            : results?.isQualificationComplete
              ? "Informational claim strength and statutory estimate ranges based on your qualification answers. This is not legal advice."
              : "Preliminary strength from your spam-database screen. Complete the questions below for full results. This is not legal advice."}
        </p>
      </header>

      {!results ? (
        <p className="text-muted-foreground text-sm">
          Open results with a claim id (for example after completing qualify) to see
          your claim summary.
        </p>
      ) : (
        <>
          {results.sol ? <SolWarningBanner sol={results.sol} /> : null}

          <ResultsStrengthAndSubjects
            strengthDisplay={results.strengthDisplay}
            subjects={results.subjects}
            showDncSummary={results.isQualificationComplete}
          />

          {results.valuation ? (
            <ResultsValuationPanel valuation={results.valuation} />
          ) : null}

          {consumerLead ? <AttorneyLeadStatusPanel lead={consumerLead} /> : null}

          {consumerLead &&
          (canReportFirmContactIssue({
            status: consumerLead.status,
            assignedFirmId: consumerLead.assignedFirmId,
            disputeSubmitted: firmContactDisputeSubmitted,
          }) ||
            firmContactDisputeSubmitted) ? (
            <FirmContactDisputeForm
              leadId={consumerLead.leadId}
              alreadySubmitted={firmContactDisputeSubmitted}
            />
          ) : null}

          {results.effectiveClaimStrength === "ineligible" ? (
            <ResultsIneligiblePanel
              claimId={results.claimId}
              reasons={results.ineligibleReasons}
              showEmailCapture={results.showEmailCapture}
              emailCaptureReason={results.emailCaptureReason}
            />
          ) : (
            <>
              {results.showEmailCapture && results.emailCaptureReason ? (
                <EmailCaptureModal
                  claimId={results.claimId}
                  reason={results.emailCaptureReason}
                />
              ) : null}
              {results.isQualificationComplete ? (
                <AttorneyReferralCta context={results} />
              ) : results.qualifyHref ? (
                <QualifyContinuationCta
                  qualifyHref={results.qualifyHref}
                  claimStatus={results.claimStatus}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}

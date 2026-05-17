import type { Metadata } from "next";
import { Suspense } from "react";

import { PostCheckPageFallback } from "@/components/post-check/post-check-page-fallback";
import { AttorneyReferralCta } from "@/components/results/attorney-referral-cta";
import { AttorneySharingChecklist } from "@/components/results/attorney-sharing-checklist";
import { EmailCaptureModal } from "@/components/email-capture-modal";
import { ResultsIneligiblePanel } from "@/components/results/results-ineligible-panel";
import { ResultsStrengthHeader } from "@/components/results/results-strength-header";
import { ResultsSubjectCard } from "@/components/results/results-subject-card";
import { ResultsValuationPanel } from "@/components/results/results-valuation-panel";
import { SolWarningBanner } from "@/components/results/sol-warning-banner";
import { enforcePostCheckAccess } from "@/lib/claims/enforce-post-check-access";
import { loadResultsPageContext } from "@/lib/claims/load-results-page-context";
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

  const results =
    claimId && user?.id
      ? await loadResultsPageContext(supabase, {
          claimId,
          userId: user.id,
        })
      : null;

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your results</h1>
        <p className="text-muted-foreground text-sm">
          Informational claim strength and statutory estimate ranges based on your
          qualification answers. This is not legal advice.
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

          <ResultsStrengthHeader display={results.strengthDisplay} />

          {results.valuation ? (
            <ResultsValuationPanel valuation={results.valuation} />
          ) : null}

          {results.effectiveClaimStrength !== "ineligible" ? (
            <AttorneySharingChecklist />
          ) : null}

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">Numbers on this claim</h2>
            {results.subjects.map((subject) => (
              <ResultsSubjectCard key={subject.subjectId} subject={subject} />
            ))}
          </section>

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
              <AttorneyReferralCta context={results} />
            </>
          )}
        </>
      )}
    </div>
  );
}

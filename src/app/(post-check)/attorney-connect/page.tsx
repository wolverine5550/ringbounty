import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PostCheckPageFallback } from "@/components/post-check/post-check-page-fallback";
import { AttorneyConnectForm } from "@/components/results/attorney-connect-form";
import { enforcePostCheckAccess } from "@/lib/claims/enforce-post-check-access";
import {
  ATTORNEY_CONNECT_PATH,
  RESULTS_PATH,
} from "@/lib/claims/gated-routes";
import { loadResultsAttorneyReferral } from "@/lib/claims/load-results-attorney-referral";
import { loadResultsPageContext } from "@/lib/claims/load-results-page-context";
import { buildCanonicalMetadata } from "@/lib/seo/canonical-metadata";
import { createClient } from "@/lib/supabase/server";

type AttorneyConnectPageProps = {
  searchParams: Promise<{ claim?: string }>;
};

export function generateMetadata(): Metadata {
  return buildCanonicalMetadata({
    pathname: ATTORNEY_CONNECT_PATH,
    title: "Connect with an attorney",
    noIndex: true,
  });
}

/**
 * Phase 13.1.2 — Expectation + consent before `leads` insert.
 */
export default function AttorneyConnectPage({ searchParams }: AttorneyConnectPageProps) {
  return (
    <Suspense fallback={<PostCheckPageFallback />}>
      <AttorneyConnectPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AttorneyConnectPageContent({ searchParams }: AttorneyConnectPageProps) {
  const { claim: claimId } = await searchParams;
  await enforcePostCheckAccess({
    returnPath: ATTORNEY_CONNECT_PATH,
    claimIdFromQuery: claimId ?? null,
  });

  if (!claimId) {
    redirect(RESULTS_PATH);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect(RESULTS_PATH);
  }

  const [referral, results] = await Promise.all([
    loadResultsAttorneyReferral(supabase, { claimId, userId: user.id }),
    loadResultsPageContext(supabase, { claimId, userId: user.id }),
  ]);

  if (!referral?.anyCanRefer || !results) {
    redirect(`${RESULTS_PATH}?claim=${claimId}`);
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Connect with an attorney — free
        </h1>
        <p className="text-muted-foreground text-sm">
          Review what happens next before we share your claim summary with participating
          attorneys.
        </p>
      </header>

      <AttorneyConnectForm
        claimId={claimId}
        effectiveClaimStrength={results.effectiveClaimStrength}
      />
    </div>
  );
}

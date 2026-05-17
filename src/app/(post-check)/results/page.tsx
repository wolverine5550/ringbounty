import { AttorneyReferralCta } from "@/components/results/attorney-referral-cta";
import { enforcePostCheckAccess } from "@/lib/claims/enforce-post-check-access";
import { loadResultsAttorneyReferral } from "@/lib/claims/load-results-attorney-referral";
import { RESULTS_PATH } from "@/lib/claims/gated-routes";
import { createClient } from "@/lib/supabase/server";

type ResultsPageProps = {
  searchParams: Promise<{ claim?: string }>;
};

/**
 * Post-qualify results (Phase 7.7 / 8). §7.7.2: primary surface after wizard completion.
 */
export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const { claim: claimId } = await searchParams;
  await enforcePostCheckAccess({
    returnPath: RESULTS_PATH,
    claimIdFromQuery: claimId ?? null,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const referralContext =
    claimId && user?.id
      ? await loadResultsAttorneyReferral(supabase, {
          claimId,
          userId: user.id,
        })
      : null;

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your results</h1>
        <p className="text-muted-foreground text-sm">
          Claim strength and dollar estimates ship in Phase 8. You have finished
          qualification for this claim.
        </p>
      </header>

      {referralContext ? (
        <AttorneyReferralCta context={referralContext} />
      ) : (
        <p className="text-muted-foreground text-sm">
          Open results with a claim id (for example after completing qualify) to see
          attorney referral options.
        </p>
      )}
    </div>
  );
}

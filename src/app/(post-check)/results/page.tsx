import { enforcePostCheckAccess } from "@/lib/claims/enforce-post-check-access";
import { RESULTS_PATH } from "@/lib/claims/gated-routes";

type ResultsPageProps = {
  searchParams: Promise<{ claim?: string }>;
};

/**
 * Placeholder results view (Phase 8). Guarded by §2.5.2 account wall for anonymous users.
 */
export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const { claim } = await searchParams;
  await enforcePostCheckAccess({
    returnPath: RESULTS_PATH,
    claimIdFromQuery: claim ?? null,
  });

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Your results</h1>
      <p className="text-muted-foreground text-sm">
        Full results UI ships in a later phase. You are signed in and past the account wall.
        {claim ? ` Claim id: ${claim}.` : null}
      </p>
    </div>
  );
}

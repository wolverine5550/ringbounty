import { enforcePostCheckAccess } from "@/lib/claims/enforce-post-check-access";
import { SUMMARY_PATH } from "@/lib/claims/gated-routes";

type SummaryPageProps = {
  searchParams: Promise<{ claim?: string }>;
};

/** Placeholder summary (Phase 8). */
export default async function SummaryPage({ searchParams }: SummaryPageProps) {
  const { claim } = await searchParams;
  await enforcePostCheckAccess({
    returnPath: SUMMARY_PATH,
    claimIdFromQuery: claim ?? null,
  });

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Claim summary</h1>
      <p className="text-muted-foreground text-sm">
        Multi-subject summary UI ships in a later phase.
      </p>
    </div>
  );
}

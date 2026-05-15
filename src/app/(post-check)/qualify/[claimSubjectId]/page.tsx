import { enforcePostCheckAccess } from "@/lib/claims/enforce-post-check-access";

type QualifyPageProps = {
  params: Promise<{ claimSubjectId: string }>;
  searchParams: Promise<{ claim?: string }>;
};

/** Placeholder qualify flow (Phase 7). */
export default async function QualifyPage({
  params,
  searchParams,
}: QualifyPageProps) {
  const { claimSubjectId } = await params;
  const { claim } = await searchParams;
  const returnPath = `/qualify/${claimSubjectId}`;

  await enforcePostCheckAccess({
    returnPath,
    claimIdFromQuery: claim ?? null,
  });

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Qualify</h1>
      <p className="text-muted-foreground text-sm">
        Qualification wizard ships in Phase 7. Subject id: {claimSubjectId}.
      </p>
    </div>
  );
}

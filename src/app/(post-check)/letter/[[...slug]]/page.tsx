import { enforcePostCheckAccess } from "@/lib/claims/enforce-post-check-access";
import { LETTER_PATH_PREFIX } from "@/lib/claims/gated-routes";

type LetterPageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ claim?: string }>;
};

/** Placeholder letter routes (Phase 9–10). */
export default async function LetterPage({ params, searchParams }: LetterPageProps) {
  const { slug } = await params;
  const { claim } = await searchParams;
  const suffix = slug?.length ? slug.join("/") : "";
  const returnPath = `${LETTER_PATH_PREFIX}${suffix}`;

  await enforcePostCheckAccess({
    returnPath,
    claimIdFromQuery: claim ?? null,
  });

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Demand letter</h1>
      <p className="text-muted-foreground text-sm">
        Letter purchase and download UI ships in a later phase.
      </p>
    </div>
  );
}

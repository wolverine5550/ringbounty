import { Suspense } from "react";

import { PostCheckPageFallback } from "@/components/post-check/post-check-page-fallback";
import { enforcePostCheckAccess } from "@/lib/claims/enforce-post-check-access";
import { LETTER_PATH_PREFIX } from "@/lib/claims/gated-routes";

type LetterPageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ claim?: string }>;
};

/**
 * Placeholder letter routes (Phase 9–10).
 * Sync shell — runtime access runs inside `<Suspense>` (Next.js 16 Cache Components).
 */
export default function LetterPage({ params, searchParams }: LetterPageProps) {
  return (
    <Suspense fallback={<PostCheckPageFallback />}>
      <LetterPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function LetterPageContent({ params, searchParams }: LetterPageProps) {
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

import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PostCheckPageFallback } from "@/components/post-check/post-check-page-fallback";
import { RESULTS_PATH } from "@/lib/claims/gated-routes";

type LetterPageProps = {
  searchParams: Promise<{ claim?: string }>;
};

/**
 * Legacy `/letter/*` routes (cancelled Phases 9–10) — redirect to `/results`.
 */
export default function LetterPage({ searchParams }: LetterPageProps) {
  return (
    <Suspense fallback={<PostCheckPageFallback />}>
      {searchParams.then(({ claim }) => {
        const url = new URL(RESULTS_PATH, "http://local");
        if (claim) {
          url.searchParams.set("claim", claim);
        }
        redirect(`${url.pathname}${url.search}`);
      })}
    </Suspense>
  );
}

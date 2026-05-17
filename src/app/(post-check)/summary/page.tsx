import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PostCheckPageFallback } from "@/components/post-check/post-check-page-fallback";
import { RESULTS_PATH } from "@/lib/claims/gated-routes";

type SummaryPageProps = {
  searchParams: Promise<{ claim?: string }>;
};

/**
 * §7.7.2 — Letter-cart `/summary` dropped for v0.1; send users to `/results`.
 * Unwraps `searchParams` inside `<Suspense>` (Next.js 16 Cache Components).
 */
export default function SummaryPage({ searchParams }: SummaryPageProps) {
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

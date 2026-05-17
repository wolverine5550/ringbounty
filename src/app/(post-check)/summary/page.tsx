import { redirect } from "next/navigation";

import { RESULTS_PATH } from "@/lib/claims/gated-routes";

type SummaryPageProps = {
  searchParams: Promise<{ claim?: string }>;
};

/**
 * §7.7.2 — Letter-cart `/summary` dropped for v0.1; send users to `/results`.
 */
export default async function SummaryPage({ searchParams }: SummaryPageProps) {
  const { claim } = await searchParams;
  const url = new URL(RESULTS_PATH, "http://local");
  if (claim) {
    url.searchParams.set("claim", claim);
  }
  redirect(`${url.pathname}${url.search}`);
}

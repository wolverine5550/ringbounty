import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ClaimsDashboard } from "@/components/dashboard/claims-dashboard";
import DashboardLoading from "@/app/dashboard/loading";
import { loadUserClaimsDashboard } from "@/lib/claims/load-user-claims-dashboard";
import { buildCanonicalMetadata } from "@/lib/seo/canonical-metadata";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = buildCanonicalMetadata({
  pathname: "/dashboard",
  title: "Your dashboard",
  noIndex: true,
});

/**
 * Signed-in home — screen numbers inline and review past checks.
 * Sync shell — auth + data load run inside `<Suspense>` (Next.js 16 Cache Components).
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardPageContent />
    </Suspense>
  );
}

async function DashboardPageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/login?next=%2Fdashboard");
  }

  const dashboard = await loadUserClaimsDashboard(supabase, user.id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Your dashboard
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
          Screen spam numbers on the left, then open any past search for strength
          and next steps.
        </p>
      </header>

      <ClaimsDashboard dashboard={dashboard} />
    </div>
  );
}

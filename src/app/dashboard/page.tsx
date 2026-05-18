import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ClaimsDashboard } from "@/components/dashboard/claims-dashboard";
import { PostCheckPageFallback } from "@/components/post-check/post-check-page-fallback";
import { Button } from "@/components/ui/button";
import { loadUserClaimsDashboard } from "@/lib/claims/load-user-claims-dashboard";
import {
  POST_LOGIN_CHECK_PATH,
  resolvePostLoginRedirectPath,
} from "@/lib/claims/post-login-redirect";
import { buildCanonicalMetadata } from "@/lib/seo/canonical-metadata";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = buildCanonicalMetadata({
  pathname: "/dashboard",
  title: "Your dashboard",
  noIndex: true,
});

/**
 * Signed-in home when the user has at least one completed check on file.
 * Sync shell — auth + data load run inside `<Suspense>` (Next.js 16 Cache Components).
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<PostCheckPageFallback />}>
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

  const postLoginPath = await resolvePostLoginRedirectPath(supabase, user.id);
  if (postLoginPath === POST_LOGIN_CHECK_PATH) {
    redirect(POST_LOGIN_CHECK_PATH);
  }

  const dashboard = await loadUserClaimsDashboard(supabase, user.id);

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Review numbers you have screened and pick up where you left off.
        </p>
      </header>

      {dashboard.claims.length === 0 ? (
        <div className="flex flex-col gap-4 rounded-lg border p-6">
          <p className="text-muted-foreground text-sm">
            You have not completed a number check yet. Run your first free lookup
            to see spam signals and next steps.
          </p>
          <Button asChild>
            <Link href="/check">Check a number</Link>
          </Button>
        </div>
      ) : (
        <ClaimsDashboard dashboard={dashboard} />
      )}
    </div>
  );
}

import Link from "next/link";

import { LoggedInAppHeaderNav } from "@/components/layout/logged-in-app-header-nav";
import { SITE_NAME } from "@/lib/marketing/constants";
import { createClient } from "@/lib/supabase/server";

/**
 * Sticky app chrome for authenticated consumers on `/check`, qualify, and results.
 * Renders nothing when there is no Supabase session (anonymous check funnel).
 */
export async function LoggedInAppHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email =
    typeof data?.claims?.email === "string" ? data.claims.email : null;

  if (!email) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight hover:underline underline-offset-4"
        >
          {SITE_NAME}
        </Link>
        <LoggedInAppHeaderNav />
      </div>
    </header>
  );
}

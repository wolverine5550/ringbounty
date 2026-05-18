import Link from "next/link";
import { Suspense } from "react";

import { LoggedInAppHeaderNav } from "@/components/layout/logged-in-app-header-nav";
import { MarketingHeaderAuth } from "@/components/marketing/marketing-header-auth";
import { SITE_NAME } from "@/lib/marketing/constants";
import { createClient } from "@/lib/supabase/server";

/**
 * Sticky app chrome on `/check`, qualify, and results.
 * Signed-in: funnel nav (no "Check numbers" on `/check`) + sign out.
 * Anonymous: brand + sign in only (no "Your results").
 */
export async function LoggedInAppHeader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email =
    typeof data?.claims?.email === "string" ? data.claims.email : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight hover:underline underline-offset-4"
        >
          {SITE_NAME}
        </Link>
        {email ? (
          <LoggedInAppHeaderNav />
        ) : (
          <nav
            className="flex items-center gap-3 text-sm sm:gap-5"
            aria-label="App"
          >
            <Suspense
              fallback={
                <span
                  className="bg-muted h-8 w-20 animate-pulse rounded-md"
                  aria-hidden
                />
              }
            >
              <MarketingHeaderAuth />
            </Suspense>
          </nav>
        )}
      </div>
    </header>
  );
}

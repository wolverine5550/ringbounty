import Link from "next/link";
import { Suspense } from "react";

import { CheckOutcomePanel } from "@/components/check-outcome-panel";
import { CheckFunnelClient } from "@/components/check/check-funnel-client";
import { CheckPageShell } from "@/components/check/check-page-shell";
import { CheckSessionBootstrap } from "@/components/check-session-bootstrap";
import { CHECK_FREE_LOOKUP_INTRO } from "@/lib/check/constants";

/**
 * Anonymous funnel entry (Phase §2.3 / §4.1–4.6). Number check first; evidence preservation before attorney referral (PRD §10).
 */
export default function CheckPage() {
  return (
    <CheckPageShell>
      <CheckSessionBootstrap />

      <header className="flex flex-col gap-2">
        <p className="text-primary text-xs font-medium uppercase tracking-wide">
          Free TCPA screening
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Check your spam calls
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Screen numbers for potential TCPA issues, organize your facts, and see whether
          an attorney connection may be worth exploring. Informational tools only — not
          legal advice.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {CHECK_FREE_LOOKUP_INTRO}
        </p>
      </header>

      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm" role="status">
            Loading check form…
          </p>
        }
      >
        <CheckFunnelClient />
      </Suspense>

      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm" role="status">
            Loading check status…
          </p>
        }
      >
        <CheckOutcomePanel />
      </Suspense>

      <footer className="flex flex-wrap gap-4 border-t border-border pt-4">
        <Link
          href="/"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Back home
        </Link>
        <Link
          href="/login"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </footer>
    </CheckPageShell>
  );
}

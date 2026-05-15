import Link from "next/link";
import { Suspense } from "react";

import { CheckOutcomePanel } from "@/components/check-outcome-panel";
import { CheckSessionBootstrap } from "@/components/check-session-bootstrap";

type CheckPageProps = {
  searchParams: Promise<{ retry?: string }>;
};

/**
 * Anonymous funnel entry (Phase §2.3 / §2.5). Proxy mints `rb_anonymous_sid`; outcome panel
 * loads gate status and renders the account wall when `isSuccessfulQuery` (§2.5.1).
 */
export default function CheckPage({ searchParams }: CheckPageProps) {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-6 p-8">
      <CheckSessionBootstrap />
      <h1 className="text-2xl font-semibold tracking-tight">Check a number</h1>
      <p className="text-muted-foreground text-sm">
        Run a TCPA-style screening without an account until we find a potential claim. The
        full evidence checklist and number entry UI arrive in Phase 4.
      </p>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">Loading check status…</p>
        }
      >
        {searchParams.then(({ retry }) => (
          <CheckOutcomePanel showRetryHint={retry === "1"} />
        ))}
      </Suspense>
      <div className="flex flex-wrap gap-3">
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
      </div>
    </div>
  );
}

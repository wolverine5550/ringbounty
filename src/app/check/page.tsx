import Link from "next/link";

import { CheckSessionBootstrap } from "@/components/check-session-bootstrap";

/**
 * Anonymous funnel entry (Phase §2.3). Proxy + `/api/session/anonymous` mint
 * HTTP-only `rb_anonymous_sid`; the real phone-check UI lands in later tasks.
 */
export default function CheckPage() {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-6 p-8">
      <CheckSessionBootstrap />
      <h1 className="text-2xl font-semibold tracking-tight">Check a number</h1>
      <p className="text-muted-foreground text-sm">
        This route exists so the proxy can mint your anonymous session cookie. The
        full screening flow will replace this placeholder.
      </p>
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

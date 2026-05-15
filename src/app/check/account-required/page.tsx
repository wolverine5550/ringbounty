import Link from "next/link";
import { Suspense } from "react";

import { AccountWall } from "@/components/account-wall";
import { CheckSessionBootstrap } from "@/components/check-session-bootstrap";
import {
  buildLoginHrefForClaim,
  sanitizePostCheckReturnPath,
} from "@/lib/claims/gated-routes";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AccountRequiredPageProps = {
  searchParams: Promise<{ claim?: string; returnTo?: string }>;
};

/**
 * Full-page account wall (§2.5.1). `claim` query param is a UUID only — no PII (§2.5.4).
 */
export default function AccountRequiredPage({
  searchParams,
}: AccountRequiredPageProps) {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-6 p-8">
      <CheckSessionBootstrap />
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">Loading…</p>
        }
      >
        {searchParams.then(({ claim, returnTo }) => {
          const returnPath = sanitizePostCheckReturnPath(returnTo);
          if (!claim || !UUID_RE.test(claim)) {
            return (
              <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Sign in required
                </h1>
                <p className="text-muted-foreground text-sm">
                  Start from{" "}
                  <Link href="/check" className="text-primary underline">
                    Check a number
                  </Link>{" "}
                  to run a screening, then continue here when prompted.
                </p>
                <Link href="/login" className="text-primary text-sm font-medium underline">
                  Sign in
                </Link>
              </div>
            );
          }

          return (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                Almost there
              </h1>
              <AccountWall claimId={claim} returnPath={returnPath} />
              <p className="text-muted-foreground text-center text-xs">
                Already have a link?{" "}
                <Link
                  href={buildLoginHrefForClaim({ returnPath, claimId: claim })}
                  className="text-primary underline"
                >
                  Resend magic link
                </Link>
              </p>
            </>
          );
        })}
      </Suspense>
    </div>
  );
}

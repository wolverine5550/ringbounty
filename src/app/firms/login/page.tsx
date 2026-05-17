import { Suspense } from "react";

import { MagicLinkLoginForm } from "@/components/magic-link-login-form";
import { FIRM_PORTAL_HOME_PATH } from "@/lib/firms/firm-portal-host";

type FirmLoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

/**
 * Firm portal sign-in (§13.4.2) — magic link; links `firm_users` on `/auth/callback`.
 */
export default function FirmLoginPage({ searchParams }: FirmLoginPageProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Firm portal</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with the email your firm administrator invited.
          </p>
        </div>
        <Suspense
          fallback={
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
          }
        >
          {searchParams.then(({ next, error }) => (
            <>
              {error === "not_linked" ? (
                <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                  This account is not linked to a firm user yet. Ask your
                  administrator to invite the same email you use to sign in.
                </p>
              ) : null}
              <MagicLinkLoginForm
                redirectNext={next ?? FIRM_PORTAL_HOME_PATH}
              />
            </>
          ))}
        </Suspense>
      </div>
    </div>
  );
}

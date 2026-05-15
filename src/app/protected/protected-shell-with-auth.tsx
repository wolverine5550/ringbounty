import { DisclaimerBanner } from "@/components/marketing/disclaimer-banner";
import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { requireUser } from "@/lib/supabase/require-user";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

/**
 * Isolated server component so `cookies()` (via `requireUser` → Supabase server client) is not
 * tied to the layout module’s static analysis boundary — matches Next.js 16 streaming guidance
 * to wrap runtime API access in Suspense from the parent layout file.
 */
export async function ProtectedShellWithAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="flex min-h-full flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center gap-20">
        <nav className="flex h-16 w-full justify-center border-b border-b-foreground/10">
          <div className="flex w-full max-w-5xl items-center justify-between p-3 px-5 text-sm">
            <div className="flex items-center gap-5 font-semibold">
              <Link href={"/"}>Next.js Supabase Starter</Link>
              <div className="flex items-center gap-2">
                <DeployButton />
              </div>
            </div>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>
        <div className="flex max-w-5xl flex-1 flex-col gap-20 p-5">{children}</div>

        <div className="mx-auto w-full max-w-5xl px-5 pb-6">
          <DisclaimerBanner variant="block" />
        </div>

        <footer className="mx-auto flex w-full items-center justify-center gap-8 border-t py-16 text-center text-xs">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </div>
  );
}

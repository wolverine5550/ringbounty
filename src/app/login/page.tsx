import { Suspense } from "react";

import { MagicLinkLoginForm } from "@/components/magic-link-login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

/**
 * RingBounty primary login entry (magic link). Password flow remains under `/auth/login`.
 *
 * Next.js 16 (Cache Components): follow the streaming guide — do **not** `await searchParams` in
 * this module; unwrap inside `<Suspense>` via `.then()` so the segment is not treated as blocking
 * the static shell. Context7: `/vercel/next.js/v16.2.2` → “Defer dynamic params access” /
 * “Unwrap dynamic params inline using .then()”.
 */
export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
          }
        >
          {searchParams.then(({ next }) => (
            <MagicLinkLoginForm redirectNext={next} />
          ))}
        </Suspense>
      </div>
    </div>
  );
}

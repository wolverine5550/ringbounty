import { Suspense } from "react";

import { ProtectedShellWithAuth } from "./protected-shell-with-auth";

function ProtectedShellFallback() {
  return (
    <div className="flex min-h-full flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center gap-20">
        <div className="flex h-16 w-full items-center justify-center border-b border-b-foreground/10 text-sm text-muted-foreground">
          Loading…
        </div>
        <div className="flex w-full max-w-5xl flex-1 flex-col gap-20 p-5" />
      </div>
    </div>
  );
}

/**
 * Wraps runtime auth (`cookies()` via Supabase) in `<Suspense>` per Next.js 16 layout guidance
 * (Context7: `/vercel/next.js/v16.2.2` — “Wrap Runtime Data Access in Suspense Boundary”).
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ProtectedShellFallback />}>
      <ProtectedShellWithAuth>{children}</ProtectedShellWithAuth>
    </Suspense>
  );
}

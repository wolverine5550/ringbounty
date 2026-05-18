import { Suspense } from "react";

import { LoggedInAppHeader } from "@/components/layout/logged-in-app-header";

function ConsumerFunnelHeaderFallback() {
  return (
    <div
      className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      aria-hidden
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <span className="bg-muted h-5 w-24 animate-pulse rounded" />
        <span className="bg-muted h-8 w-40 animate-pulse rounded-md" />
      </div>
    </div>
  );
}

/**
 * Suspense-wrapped consumer funnel header (signed-in nav or anonymous sign-in).
 */
export function ConsumerFunnelHeader() {
  return (
    <Suspense fallback={<ConsumerFunnelHeaderFallback />}>
      <LoggedInAppHeader />
    </Suspense>
  );
}

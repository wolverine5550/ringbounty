import { Suspense } from "react";

import { FirmPortalShell } from "@/components/firms/firm-portal-shell";

function FirmPortalFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
      Loading firm portal…
    </div>
  );
}

/** Authenticated firm portal chrome (§13.4). */
export default function FirmPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<FirmPortalFallback />}>
      <FirmPortalShell>{children}</FirmPortalShell>
    </Suspense>
  );
}

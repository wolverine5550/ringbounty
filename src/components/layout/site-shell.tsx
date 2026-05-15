import type { ReactNode } from "react";

import { DisclaimerBanner } from "@/components/marketing/disclaimer-banner";

type SiteShellProps = {
  /** Route-level content (pages, nested layouts). Rendered inside the primary `<main>`. */
  children: ReactNode;
};

/**
 * Root chrome for RingBounty: global header region, primary main, and a footer
 * reserved for cross-cutting notices (e.g. “not legal advice”). Keeps a single
 * document `<main>` so nested pages should use `<section>` / `<div>` instead
 * of another `<main>`.
 */
export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header
        className="shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        role="banner"
        aria-label="Application header"
      >
        {/* Global nav / brand row will mount here in later milestones. */}
      </header>

      <main id="site-main" className="flex min-h-0 flex-1 flex-col">
        {children}
      </main>

      <footer
        className="shrink-0 border-t border-border bg-muted/30 px-4 py-3"
        role="contentinfo"
        aria-label="Global notices"
      >
        <DisclaimerBanner variant="footer" />
      </footer>
    </div>
  );
}

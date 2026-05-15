import Link from "next/link";

import { PRODUCT_DISCLAIMER } from "@/lib/marketing/constants";

/**
 * Page-level legal footer (§3.1.4): PRD disclaimer plus links to legal pages.
 */
export function MarketingPageFooter() {
  return (
    <footer
      className="border-t border-border bg-muted/20 px-4 py-10"
      aria-label="Legal and policies"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 text-center">
        <p className="text-muted-foreground text-xs leading-relaxed">
          {PRODUCT_DISCLAIMER}
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm"
          aria-label="Policy links"
        >
          <Link
            href="/privacy"
            className="text-primary underline-offset-4 hover:underline"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-primary underline-offset-4 hover:underline"
          >
            Terms
          </Link>
          <Link
            href="/faq"
            className="text-primary underline-offset-4 hover:underline"
          >
            FAQ
          </Link>
        </nav>
      </div>
    </footer>
  );
}

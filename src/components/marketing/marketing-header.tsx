import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/marketing/constants";

/**
 * Lightweight header for public marketing pages (§3.1 / §3.2).
 */
export function MarketingHeader() {
  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight hover:underline underline-offset-4"
        >
          {SITE_NAME}
        </Link>
        <nav
          className="flex items-center gap-4 text-sm"
          aria-label="Marketing"
        >
          <Link
            href="/how-it-works"
            className="text-muted-foreground hover:text-foreground"
          >
            How it works
          </Link>
          <Button asChild size="sm">
            <Link href="/check">Check a number</Link>
          </Button>
        </nav>
      </div>
    </div>
  );
}

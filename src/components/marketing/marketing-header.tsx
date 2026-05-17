import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FIRM_PORTAL_LOGIN_PATH } from "@/lib/firms/firm-portal-host";
import { SITE_NAME } from "@/lib/marketing/constants";

import {
  LANDING_FAQ_SECTION_ID,
  LANDING_HOW_IT_WORKS_SECTION_ID,
} from "@/lib/marketing/landing-content";

/** In-page anchors on `/` (sticky header offset via `scroll-mt-*` on sections). */
const NAV_LINKS = [
  { href: `/#${LANDING_HOW_IT_WORKS_SECTION_ID}`, label: "How it works" },
  { href: `/#${LANDING_FAQ_SECTION_ID}`, label: "FAQ" },
] as const;

/**
 * Navigation menu for public marketing pages (wireframe header).
 */
export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight hover:underline underline-offset-4"
        >
          {SITE_NAME}
        </Link>
        <nav
          className="flex items-center gap-3 text-sm sm:gap-6"
          aria-label="Main"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={FIRM_PORTAL_LOGIN_PATH}
            className="text-muted-foreground hover:text-foreground"
          >
            Law firms
          </Link>
          <Button asChild size="sm">
            <Link href="/check">Check a number</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

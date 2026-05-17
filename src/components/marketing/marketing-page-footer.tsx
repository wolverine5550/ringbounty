import Link from "next/link";

import { DisclaimerBanner } from "@/components/marketing/disclaimer-banner";
import { Button } from "@/components/ui/button";
import { COPYRIGHT_YEAR, SITE_NAME } from "@/lib/marketing/constants";
import { SEO_RESOURCE_LINKS } from "@/lib/marketing/seo-landing-pages";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/check", label: "Check a number" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Resources",
    links: SEO_RESOURCE_LINKS,
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
] as const;

/**
 * Multi-column footer (wireframe): sitemap links, disclaimer, contact CTA.
 */
export function MarketingPageFooter() {
  return (
    <footer className="border-t border-border bg-muted/20" aria-label="Site footer">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3 lg:col-span-2">
            <p className="text-sm font-semibold">{SITE_NAME}</p>
            <p className="text-muted-foreground max-w-md text-xs leading-relaxed">
              Informational TCPA screening and optional attorney introductions for
              U.S. consumers. Not a law firm.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <nav
              key={column.title}
              className="flex flex-col gap-3"
              aria-label={column.title}
            >
              <p className="text-sm font-medium">{column.title}</p>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground text-sm hover:text-foreground hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Connect</p>
            <p className="text-muted-foreground text-xs">
              Questions or privacy requests:{" "}
              <a
                href="mailto:privacy@ringbounty.com"
                className="text-primary hover:underline"
              >
                privacy@ringbounty.com
              </a>
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <DisclaimerBanner variant="footer" />
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-muted-foreground text-xs">
            © {COPYRIGHT_YEAR} {SITE_NAME}. All rights reserved.
          </p>
          <Button asChild size="sm">
            <Link href="/check">Get started</Link>
          </Button>
        </div>
      </div>
    </footer>
  );
}

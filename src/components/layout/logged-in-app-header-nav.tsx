"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { getConsumerFunnelNavLinksForPath } from "@/lib/layout/consumer-funnel-nav";

/**
 * Client nav row — pathname-aware so `/check` does not show "Check numbers".
 */
export function LoggedInAppHeaderNav() {
  const pathname = usePathname() ?? "";
  const links = getConsumerFunnelNavLinksForPath(pathname);

  return (
    <nav
      className="flex items-center gap-3 text-sm sm:gap-5"
      aria-label="App"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-muted-foreground hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
      <SignOutButton redirectTo="/" />
    </nav>
  );
}

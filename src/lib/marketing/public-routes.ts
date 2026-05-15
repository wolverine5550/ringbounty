/**
 * Paths reachable without authentication (Phase §3 marketing surface).
 * `/` is handled separately in proxy; this list covers other public pages.
 */
const PUBLIC_MARKETING_EXACT_PATHS = [
  "/how-it-works",
  "/faq",
  "/privacy",
  "/terms",
] as const;

/** True when anonymous visitors may view the route without a login redirect. */
export function isPublicMarketingPath(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }
  return PUBLIC_MARKETING_EXACT_PATHS.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

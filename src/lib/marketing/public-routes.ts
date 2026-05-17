import { parseCompanySpamCallsPath } from "@/lib/seo/company-pages";
import { SEO_LANDING_PATHS } from "@/lib/seo/sitemap-routes";

/**
 * Paths reachable without authentication (Phase §3 marketing surface).
 * `/` is handled separately in proxy; this list covers other public pages.
 */
const PUBLIC_MARKETING_EXACT_PATHS = [
  "/how-it-works",
  "/faq",
  "/privacy",
  "/terms",
  ...SEO_LANDING_PATHS,
] as const;

/** True when anonymous visitors may view the route without a login redirect. */
export function isPublicMarketingPath(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }

  const segment = pathname.replace(/^\//, "").split("/")[0] ?? "";
  if (segment && parseCompanySpamCallsPath(segment)) {
    return true;
  }

  return PUBLIC_MARKETING_EXACT_PATHS.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

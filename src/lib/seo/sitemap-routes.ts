/**
 * Phase 11.4.1 — Public paths included in sitemap.xml.
 */

import { listCompanySeoPaths } from "./company-pages";

/** Core SEO landing pages (§11.2). */
export const SEO_LANDING_PATHS = [
  "/tcpa-violation-checker",
  "/spam-call-compensation",
  "/do-not-call-registry-violation",
  "/robocall-lawsuit",
] as const;

/** Static marketing and legal pages. */
export const STATIC_MARKETING_PATHS = [
  "/",
  "/how-it-works",
  "/faq",
  "/privacy",
  "/terms",
  "/check",
] as const;

/** All indexable paths for sitemap generation. */
export function listSitemapPaths(): string[] {
  return [
    ...STATIC_MARKETING_PATHS,
    ...SEO_LANDING_PATHS,
    ...listCompanySeoPaths(),
  ];
}

import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/site-url";
import { listSitemapPaths } from "@/lib/seo/sitemap-routes";

/**
 * Phase 11.4.1 — Sitemap for static marketing, SEO landings, and company pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return listSitemapPaths().map((pathname) => ({
    url: absoluteUrl(pathname),
    lastModified: new Date(),
    changeFrequency: pathname === "/" ? "weekly" : "monthly",
    priority: pathname === "/" ? 1 : pathname.startsWith("/tcpa-") ? 0.9 : 0.7,
  }));
}

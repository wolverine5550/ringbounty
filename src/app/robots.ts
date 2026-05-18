import type { MetadataRoute } from "next";

import { absoluteUrl, isSeoStagingEnvironment } from "@/lib/seo/site-url";

/** Paths that should not be indexed in production. */
const PRODUCTION_DISALLOW_PATHS = [
  "/api/",
  "/auth/",
  "/protected/",
  "/dashboard",
  "/results",
  "/qualify/",
  "/summary",
  "/letter/",
  "/login",
] as const;

/**
 * Phase 11.4.2 — robots.txt: block preview/staging; disallow private app routes in production.
 */
export default function robots(): MetadataRoute.Robots {
  if (isSeoStagingEnvironment()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRODUCTION_DISALLOW_PATHS],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

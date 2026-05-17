/**
 * Phase 11.4 — Canonical site origin for sitemap, robots, and metadata.
 */

const LOCAL_DEV_ORIGIN = "http://localhost:3000";

/** Normalizes env URL to an origin without a trailing slash. */
export function normalizeSiteOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Resolves the public site origin for SEO metadata and sitemaps.
 * Prefer `NEXT_PUBLIC_SITE_URL`; fall back to `VERCEL_URL`; else localhost.
 */
export function getSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return normalizeSiteOrigin(configured);
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return normalizeSiteOrigin(vercelHost);
  }

  return LOCAL_DEV_ORIGIN;
}

/** True on Vercel preview deployments — block crawlers in robots.txt. */
export function isSeoStagingEnvironment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

/** Joins a pathname to the site origin (pathname must start with `/`). */
export function absoluteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteOrigin()}${path}`;
}

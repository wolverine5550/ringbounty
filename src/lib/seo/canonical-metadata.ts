/**
 * Phase 11.4.3 — Canonical metadata helpers (strip query variants).
 */

import type { Metadata } from "next";

import { absoluteUrl } from "./site-url";

export type BuildCanonicalMetadataParams = {
  /** Path only, e.g. `/results` or `/tcpa-violation-checker`. */
  pathname: string;
  title?: string;
  description?: string;
  /** When true, omit page from search indexes (authenticated / funnel pages). */
  noIndex?: boolean;
};

/**
 * Builds `alternates.canonical` (and optional title/description) for a path without query strings.
 */
export function buildCanonicalMetadata(
  params: BuildCanonicalMetadataParams,
): Metadata {
  const pathname = params.pathname.startsWith("/")
    ? params.pathname
    : `/${params.pathname}`;

  const metadata: Metadata = {
    alternates: {
      canonical: pathname,
    },
  };

  if (params.title) {
    metadata.title = params.title;
  }
  if (params.description) {
    metadata.description = params.description;
  }
  if (params.noIndex) {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}

/** Absolute canonical URL string (for JSON-LD or tests). */
export function canonicalAbsoluteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return absoluteUrl(path);
}

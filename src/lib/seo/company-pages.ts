/**
 * Phase 11.1 / 11.3 — Company SEO page registry and slug helpers.
 * Registry is empty until §11.3 content ships.
 */

export const COMPANY_SPAM_CALLS_SUFFIX = "-spam-calls" as const;

export const COMPANY_SPAM_CALLS_LEGACY_SUFFIX = "-spam-calls-compensation" as const;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type CompanySeoPage = {
  /** URL segment before `-spam-calls`, e.g. `carshield`. */
  slug: string;
  /** Display name for titles, e.g. `CarShield`. */
  displayName: string;
  /** Unique opening paragraph (§11.3.2) — required when page is registered. */
  intro: string;
};

/**
 * Registered company pages (§11.3). Empty until content modules are added.
 */
export const COMPANY_SEO_PAGES: readonly CompanySeoPage[] = [];

const companyBySlug = new Map(
  COMPANY_SEO_PAGES.map((page) => [page.slug, page] as const),
);

/** Normalizes a company name to a URL slug (`CarShield` → `carshield`). */
export function slugifyCompanyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Validates a company slug segment. */
export function isValidCompanySlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/**
 * Parses `/{slug}-spam-calls` pathname segment; returns company slug or null.
 */
export function parseCompanySpamCallsPath(pathSegment: string): string | null {
  if (!pathSegment.endsWith(COMPANY_SPAM_CALLS_SUFFIX)) {
    return null;
  }

  const companySlug = pathSegment.slice(0, -COMPANY_SPAM_CALLS_SUFFIX.length);
  if (!companySlug || !isValidCompanySlug(companySlug)) {
    return null;
  }

  return companySlug;
}

export function companySpamCallsPath(slug: string): string {
  return `/${slug}${COMPANY_SPAM_CALLS_SUFFIX}`;
}

export function getCompanySeoPage(slug: string): CompanySeoPage | undefined {
  return companyBySlug.get(slug);
}

/** All registered company canonical paths for the sitemap. */
export function listCompanySeoPaths(): string[] {
  return COMPANY_SEO_PAGES.map((page) => companySpamCallsPath(page.slug));
}

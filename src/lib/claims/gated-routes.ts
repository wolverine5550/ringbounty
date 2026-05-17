/**
 * Post-check routes that require authentication after a **successful query** (§2.5.2).
 * Anonymous users may reach these URLs only to be redirected to the account wall or login.
 */

/** Full results view — blocked for anonymous successful-query state. */
export const RESULTS_PATH = "/results";

/** Attorney expectation + consent before `leads` insert (Phase 13.1). */
export const ATTORNEY_CONNECT_PATH = "/attorney-connect";

/** Multi-subject summary before letter purchase. */
export const SUMMARY_PATH = "/summary";

/** Per-subject qualification wizard (Phase 7). */
export const QUALIFY_PATH_PREFIX = "/qualify/";

/** Letter preview / purchase / download (Phase 9–10). */
export const LETTER_PATH_PREFIX = "/letter/";

/** Dedicated account-wall landing (no PII in path; optional `claim` query param). */
export const ACCOUNT_REQUIRED_PATH = "/check/account-required";

const GATED_PREFIXES = [
  RESULTS_PATH,
  ATTORNEY_CONNECT_PATH,
  SUMMARY_PATH,
  QUALIFY_PATH_PREFIX,
  LETTER_PATH_PREFIX,
] as const;

/**
 * Whether `pathname` is a post-check route that must enforce the account wall for
 * unauthenticated visitors who already have a successful query.
 */
export function isPostCheckGatedRoute(pathnameOrUrl: string): boolean {
  const pathname = pathnameOrUrl.split("?")[0]?.split("#")[0] ?? pathnameOrUrl;
  return GATED_PREFIXES.some((prefix) =>
    prefix.endsWith("/") ? pathname.startsWith(prefix) : pathname === prefix,
  );
}

/**
 * Safe magic-link `next` target: gated funnel paths and `/protected`, not open redirects.
 */
export function sanitizeLoginNextPath(
  candidate: string | null | undefined,
  fallback: string = "/protected",
): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }
  if (
    isPostCheckGatedRoute(candidate) ||
    candidate === "/protected" ||
    candidate.startsWith("/protected/") ||
    candidate === "/check" ||
    candidate.startsWith("/firms/")
  ) {
    return candidate;
  }
  return fallback;
}

/**
 * Safe post-login return path: must be a gated app path, not an open redirect.
 */
export function sanitizePostCheckReturnPath(
  candidate: string | null | undefined,
  fallback: string = RESULTS_PATH,
): string {
  if (!candidate || !candidate.startsWith("/")) {
    return fallback;
  }
  if (candidate.startsWith("//")) {
    return fallback;
  }
  if (!isPostCheckGatedRoute(candidate)) {
    return fallback;
  }
  return candidate;
}

/**
 * Builds `/login?next=…` with only a claim id in the gated path query (no phone / email).
 */
export function buildLoginHrefForClaim(params: {
  returnPath: string;
  claimId: string;
}): string {
  const returnPath = sanitizePostCheckReturnPath(params.returnPath);
  const url = new URL(returnPath, "http://local");
  url.searchParams.set("claim", params.claimId);
  const next = `${url.pathname}${url.search}`;
  return `/login?next=${encodeURIComponent(next)}`;
}

/**
 * Builds `/check/account-required?claim=…&returnTo=…` for the full-page account wall.
 */
export function buildAccountRequiredHref(params: {
  claimId: string;
  returnTo?: string;
}): string {
  const url = new URL(ACCOUNT_REQUIRED_PATH, "http://local");
  url.searchParams.set("claim", params.claimId);
  if (params.returnTo) {
    url.searchParams.set(
      "returnTo",
      sanitizePostCheckReturnPath(params.returnTo),
    );
  }
  return `${url.pathname}${url.search}`;
}

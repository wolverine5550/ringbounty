/** Path prefix for the in-app firm portal (same Next.js deploy as consumer). */
export const FIRM_PORTAL_PATH_PREFIX = "/firms" as const;

/** Public marketing landing for firms (portal sign-in deferred). */
export const FIRM_LANDING_PATH = FIRM_PORTAL_PATH_PREFIX;

/** Default landing after firm sign-in. */
export const FIRM_PORTAL_HOME_PATH = `${FIRM_PORTAL_PATH_PREFIX}/leads` as const;

/** Public firm auth entry (magic link) — redirects to {@link FIRM_LANDING_PATH} while sign-in is closed. */
export const FIRM_PORTAL_LOGIN_PATH = `${FIRM_PORTAL_PATH_PREFIX}/login` as const;

/**
 * Hostnames served as the firm portal (§13.4.1).
 * Production: `firms.ringbounty.com`. Local: `firms.localhost` or path `/firms/*`.
 */
export function isFirmPortalHostname(hostname: string): boolean {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  return host === "firms.localhost" || host.startsWith("firms.");
}

/** True when the request targets the firm portal surface. */
export function isFirmPortalPath(pathname: string): boolean {
  return (
    pathname === FIRM_PORTAL_PATH_PREFIX ||
    pathname.startsWith(`${FIRM_PORTAL_PATH_PREFIX}/`)
  );
}

/** True when unauthenticated visitors may view the route. */
export function isFirmPortalPublicPath(pathname: string): boolean {
  return (
    pathname === FIRM_LANDING_PATH ||
    pathname === FIRM_PORTAL_LOGIN_PATH ||
    pathname.startsWith(`${FIRM_PORTAL_PATH_PREFIX}/onboarding/stripe/`)
  );
}

import { NextResponse, type NextRequest } from "next/server";

import {
  FIRM_PORTAL_HOME_PATH,
  FIRM_PORTAL_LOGIN_PATH,
  FIRM_PORTAL_PATH_PREFIX,
  isFirmPortalHostname,
  isFirmPortalPath,
  isFirmPortalPublicPath,
} from "./firm-portal-host";

function withPriorCookies(
  request: NextRequest,
  prior: NextResponse,
  next: NextResponse,
): NextResponse {
  prior.cookies.getAll().forEach((cookie) => {
    next.cookies.set(cookie.name, cookie.value, cookie);
  });
  return next;
}

/**
 * Phase 13.4.1 — Subdomain + path routing for the firm portal in the same Next.js app.
 * Returns `null` when the request should continue with the existing response.
 */
export function applyFirmPortalProxy(
  request: NextRequest,
  prior: NextResponse,
): NextResponse | null {
  const hostname = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;
  const onFirmHost = isFirmPortalHostname(hostname);
  const onFirmPath = isFirmPortalPath(pathname);

  if (onFirmHost && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = FIRM_PORTAL_HOME_PATH;
    return withPriorCookies(request, prior, NextResponse.redirect(url));
  }

  if (onFirmHost && !onFirmPath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname =
      pathname === "/"
        ? FIRM_PORTAL_HOME_PATH
        : `${FIRM_PORTAL_PATH_PREFIX}${pathname}`;
    return withPriorCookies(
      request,
      prior,
      NextResponse.rewrite(rewriteUrl),
    );
  }

  if (onFirmPath && !isFirmPortalPublicPath(pathname)) {
    prior.headers.set("x-ringbounty-firm-portal", "1");
  }

  return null;
}

/** Firm-portal login redirect when session is missing. */
export function buildFirmPortalLoginRedirect(
  request: NextRequest,
): NextResponse {
  const url = request.nextUrl.clone();
  const returnPath = `${url.pathname}${url.search}`;
  url.pathname = FIRM_PORTAL_LOGIN_PATH;
  url.search = "";
  url.searchParams.set("next", returnPath);
  return NextResponse.redirect(url);
}

/** Whether unauthenticated access should redirect to firm login instead of consumer `/login`. */
export function shouldUseFirmPortalLogin(pathname: string, host: string): boolean {
  return isFirmPortalPath(pathname) || isFirmPortalHostname(host);
}

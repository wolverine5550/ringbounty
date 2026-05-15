import { NextResponse, type NextRequest } from "next/server";

/** HTTP-only cookie storing the browser’s anonymous funnel id (Phase §2.3). */
export const ANONYMOUS_SESSION_COOKIE_NAME = "rb_anonymous_sid";

/** 30 days — matches task_manager §2.3.2 guidance. */
export const ANONYMOUS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Rejects forged or garbage cookie values before they reach SQL.
 * Only UUID v4 strings are accepted (matches `crypto.randomUUID()` output).
 */
export function isValidAnonymousSessionId(
  value: string | undefined,
): value is string {
  return typeof value === "string" && UUID_V4.test(value);
}

/**
 * Cookie flags for the anonymous session: HTTP-only, SameSite=Lax, path `/`.
 * `Secure` is enabled in production so local HTTP dev still receives the cookie.
 */
export function getAnonymousSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: ANONYMOUS_SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
}

/** Paths where anonymous users may enter without auth redirect. */
export function isAnonymousFunnelPath(pathname: string): boolean {
  return (
    pathname === "/check" ||
    pathname.startsWith("/check/") ||
    pathname.startsWith("/api/claims/anonymous") ||
    pathname.startsWith("/api/session/anonymous")
  );
}

/**
 * Sets `rb_anonymous_sid` on the outgoing response when missing or invalid.
 * Used from `proxy.ts` (including before the Supabase env early-return).
 */
export function attachAnonymousSessionCookieIfNeeded(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  if (!isAnonymousFunnelPath(request.nextUrl.pathname)) {
    return response;
  }
  const raw = request.cookies.get(ANONYMOUS_SESSION_COOKIE_NAME)?.value;
  if (isValidAnonymousSessionId(raw)) {
    return response;
  }
  response.cookies.set(
    ANONYMOUS_SESSION_COOKIE_NAME,
    crypto.randomUUID(),
    getAnonymousSessionCookieOptions(),
  );
  return response;
}

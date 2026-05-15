import { type NextRequest, NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  attachAnonymousSessionCookieIfNeeded,
  isValidAnonymousSessionId,
} from "@/lib/anonymous-session";

/**
 * Ensures `rb_anonymous_sid` exists (belt-and-suspenders if proxy did not set it).
 * Safe to call from `/check` on load; does not touch the database.
 */
export async function POST(request: NextRequest) {
  const raw = request.cookies.get(ANONYMOUS_SESSION_COOKIE_NAME)?.value;
  const response = NextResponse.json({
    ok: true,
    session_ready: isValidAnonymousSessionId(raw),
  });
  return attachAnonymousSessionCookieIfNeeded(request, response);
}

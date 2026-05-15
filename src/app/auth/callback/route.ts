import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  getAnonymousSessionCookieOptions,
  isValidAnonymousSessionId,
} from "@/lib/anonymous-session";
import { mergeAnonymousDraftOnLogin } from "@/lib/claims/merge-anonymous-draft-on-login";
import type { Database } from "@/types/database";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";

/**
 * PKCE / server-side auth: Supabase redirects here with `?code=` after the user
 * follows a magic link. We exchange the code for a session and persist cookies on
 * the redirect response (see Supabase SSR + Next.js App Router route handlers).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") ?? "/protected";

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/auth/error?error=Missing%20authorization%20code",
        requestUrl.origin,
      ),
    );
  }

  const safeNext = nextPath.startsWith("/") ? nextPath : "/protected";
  const response = NextResponse.redirect(new URL(safeNext, requestUrl.origin));

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/auth/error?error=${encodeURIComponent(error.message)}`,
        requestUrl.origin,
      ),
    );
  }

  // §2.3.3 — Attach anonymous draft claim to the new session (full collision UX in §2.6).
  const anonymousRaw = request.cookies.get(ANONYMOUS_SESSION_COOKIE_NAME)?.value;
  if (isValidAnonymousSessionId(anonymousRaw)) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const authUserId = userData.user?.id;
      if (authUserId) {
        const admin = createAdminClient();
        const { mergedClaimId } = await mergeAnonymousDraftOnLogin(admin, {
          authUserId,
          anonymousSessionId: anonymousRaw,
        });
        if (mergedClaimId) {
          response.cookies.set(
            ANONYMOUS_SESSION_COOKIE_NAME,
            "",
            { ...getAnonymousSessionCookieOptions(), maxAge: 0 },
          );
        }
      }
    } catch (e) {
      if (!(e instanceof SupabaseAdminKeyMissingError)) {
        console.error("mergeAnonymousDraftOnLogin", e);
      }
      // Intentionally keep the anonymous cookie so a later retry can merge once configured.
    }
  }

  return response;
}

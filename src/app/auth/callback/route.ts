import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  ANONYMOUS_SESSION_COOKIE_NAME,
  getAnonymousSessionCookieOptions,
  isValidAnonymousSessionId,
} from "@/lib/anonymous-session";
import { mergeAnonymousDraftOnLogin } from "@/lib/claims/merge-anonymous-draft-on-login";
import { sanitizeLoginNextPath } from "@/lib/claims/gated-routes";
import { linkFirmUserOnLogin } from "@/lib/firms/link-firm-user-on-login";
import {
  isLegacyPostLoginPath,
  resolvePostLoginRedirectPath,
} from "@/lib/claims/post-login-redirect";
import { resolvePostMergeRedirectPath } from "@/lib/claims/post-merge-redirect";
import type { Database } from "@/types/database";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

/**
 * PKCE / server-side auth: Supabase redirects here with `?code=` after the user
 * follows a magic link. We exchange the code for a session and persist cookies on
 * the redirect response (see Supabase SSR + Next.js App Router route handlers).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/auth/error?error=Missing%20authorization%20code",
        requestUrl.origin,
      ),
    );
  }

  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(incoming) {
          cookiesToSet.push(...incoming);
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

  const { data: userData } = await supabase.auth.getUser();
  const authUser = userData.user;
  const authUserId = authUser?.id;

  let redirectTarget: string;
  if (nextPath) {
    const safeNext = nextPath.startsWith("/") ? nextPath : "/check";
    redirectTarget = sanitizeLoginNextPath(safeNext);
    if (isLegacyPostLoginPath(redirectTarget) && authUserId) {
      redirectTarget = await resolvePostLoginRedirectPath(supabase, authUserId);
    }
  } else if (authUserId) {
    redirectTarget = await resolvePostLoginRedirectPath(supabase, authUserId);
  } else {
    redirectTarget = "/check";
  }

  // §13.4.2 — Link pre-provisioned `firm_users` row when email matches an invite.
  try {
    if (authUserId && authUser?.email) {
      const admin = createAdminClient();
      await linkFirmUserOnLogin(admin, {
        authUserId,
        email: authUser.email,
      });
    }
  } catch (e) {
    if (!(e instanceof SupabaseAdminKeyMissingError)) {
      console.error("linkFirmUserOnLogin", e);
    }
  }

  // §2.6 — Attach anonymous draft; redirect to `/results?claim=` when merge succeeds (§2.6.5).
  const anonymousRaw = request.cookies.get(ANONYMOUS_SESSION_COOKIE_NAME)?.value;
  let clearAnonymousCookie = false;

  if (isValidAnonymousSessionId(anonymousRaw)) {
    try {
      if (authUserId) {
        const admin = createAdminClient();
        const { mergedClaimId } = await mergeAnonymousDraftOnLogin(admin, {
          authUserId,
          anonymousSessionId: anonymousRaw,
        });
        if (mergedClaimId) {
          redirectTarget = await resolvePostMergeRedirectPath(
            admin,
            mergedClaimId,
          );
          clearAnonymousCookie = true;
        }
      }
    } catch (e) {
      if (!(e instanceof SupabaseAdminKeyMissingError)) {
        console.error("mergeAnonymousDraftOnLogin", e);
      }
    }
  }

  const response = NextResponse.redirect(
    new URL(redirectTarget, requestUrl.origin),
  );

  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );

  if (clearAnonymousCookie) {
    response.cookies.set(ANONYMOUS_SESSION_COOKIE_NAME, "", {
      ...getAnonymousSessionCookieOptions(),
      maxAge: 0,
    });
  }

  return response;
}

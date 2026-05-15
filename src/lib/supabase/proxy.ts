import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  attachAnonymousSessionCookieIfNeeded,
  isAnonymousAllowedPath,
} from "@/lib/anonymous-session";
import type { Database } from "@/types/database";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Mint anonymous session on /check even when Supabase public env vars are unset.
  supabaseResponse = attachAnonymousSessionCookieIfNeeded(
    request,
    supabaseResponse,
  );

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // If Supabase Auth "Site URL" or email redirect points at `/protected` (or `/`) with a
  // PKCE `code`, the exchange must run on `/auth/callback` — otherwise the proxy sends
  // anonymous users to `/login` and the `code` is lost. Forward before session checks.
  const pkceCode = request.nextUrl.searchParams.get("code");
  const path = request.nextUrl.pathname;
  if (
    pkceCode &&
    (path === "/protected" || path === "/")
  ) {
    const target = request.nextUrl.clone();
    target.pathname = "/auth/callback";
    target.searchParams.delete("code");
    target.searchParams.set("code", pkceCode);
    if (!target.searchParams.has("next")) {
      target.searchParams.set("next", path === "/" ? "/" : "/protected");
    }
    return NextResponse.redirect(target);
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const pathname = request.nextUrl.pathname;

  if (
    pathname !== "/" &&
    !user &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/auth") &&
    !isAnonymousAllowedPath(pathname)
  ) {
    // RingBounty primary auth entry is magic link at `/login` (Phase 2.1).
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return attachAnonymousSessionCookieIfNeeded(request, supabaseResponse);
}

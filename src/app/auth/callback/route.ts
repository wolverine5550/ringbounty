import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "@/types/database";

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

  return response;
}

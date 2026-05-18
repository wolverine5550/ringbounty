import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { POST_LOGIN_DASHBOARD_PATH } from "@/lib/claims/post-login-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth affordances for public marketing pages: sign-in, or dashboard + sign-out when session exists.
 */
export async function MarketingHeaderAuth() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email =
    typeof data?.claims?.email === "string" ? data.claims.email : null;

  if (!email) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <>
      <Link
        href={POST_LOGIN_DASHBOARD_PATH}
        className="text-muted-foreground hover:text-foreground"
      >
        Dashboard
      </Link>
      <SignOutButton redirectTo="/" />
    </>
  );
}

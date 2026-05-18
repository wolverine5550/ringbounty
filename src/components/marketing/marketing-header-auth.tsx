import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth affordances for public marketing pages: sign-in link or sign-out when session exists.
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

  return <SignOutButton redirectTo="/" />;
}

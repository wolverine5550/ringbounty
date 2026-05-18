"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  /** Where to send the user after Supabase clears the session cookie. */
  redirectTo?: string;
  className?: string;
};

/**
 * Client sign-out control — used in marketing header and other shells.
 */
export function SignOutButton({
  redirectTo = "/",
  className,
}: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.push(redirectTo);
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}

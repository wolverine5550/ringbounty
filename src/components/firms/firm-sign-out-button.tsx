"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { FIRM_LANDING_PATH } from "@/lib/firms/firm-portal-host";

export function FirmSignOutButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push(FIRM_LANDING_PATH);
      }}
    >
      Sign out
    </Button>
  );
}

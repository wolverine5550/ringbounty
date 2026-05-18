import { redirect } from "next/navigation";
import { Suspense } from "react";

import { resolvePostLoginRedirectPath } from "@/lib/claims/post-login-redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Legacy starter-kit route — forwards to `/check` or `/dashboard` based on claim history.
 */
export default function ProtectedPage() {
  return (
    <Suspense fallback={null}>
      <ProtectedPageRedirect />
    </Suspense>
  );
}

async function ProtectedPageRedirect(): Promise<null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/login");
    return null;
  }

  const target = await resolvePostLoginRedirectPath(supabase, user.id);
  redirect(target);
  return null;
}

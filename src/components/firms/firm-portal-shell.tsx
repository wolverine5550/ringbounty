import Link from "next/link";

import { FirmSignOutButton } from "@/components/firms/firm-sign-out-button";
import { requireFirmUser } from "@/lib/firms/require-firm-user";
import { createClient } from "@/lib/supabase/server";

/**
 * Server shell: validates firm membership and shows firm name header.
 */
export async function FirmPortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { membership } = await requireFirmUser();
  const supabase = await createClient();

  const { data: firm } = await supabase
    .from("law_firms")
    .select("name, stripe_connect_charges_enabled")
    .eq("id", membership.firmId)
    .maybeSingle();

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Firm portal
          </p>
          <h1 className="text-xl font-semibold">{firm?.name ?? "Your firm"}</h1>
          <p className="text-sm text-muted-foreground">{membership.email}</p>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/firms/leads" className="underline-offset-4 hover:underline">
            Leads
          </Link>
          {!firm?.stripe_connect_charges_enabled ? (
            <Link
              href="/firms/onboarding/stripe/refresh"
              className="underline-offset-4 hover:underline"
            >
              Stripe setup
            </Link>
          ) : null}
          <FirmSignOutButton />
        </nav>
      </header>
      {children}
    </div>
  );
}


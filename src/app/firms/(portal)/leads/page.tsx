import { FirmLeadsDashboard } from "@/components/firms/firm-leads-dashboard";
import { parseFirmLeadFilters } from "@/lib/firms/firm-lead-filters";
import { loadFirmLeads } from "@/lib/firms/load-firm-leads";
import { requireFirmUser } from "@/lib/firms/require-firm-user";
import { createClient } from "@/lib/supabase/server";

type FirmLeadsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Firm lead list with filters (§13.4.3) + realtime wrapper (§13.4.4). */
export default async function FirmLeadsPage({ searchParams }: FirmLeadsPageProps) {
  const { membership } = await requireFirmUser();
  const supabase = await createClient();
  const rows = await loadFirmLeads(supabase);
  const filters = parseFirmLeadFilters(await searchParams);

  const { data: firm } = await supabase
    .from("law_firms")
    .select("lead_fee_cents, stripe_connect_charges_enabled")
    .eq("id", membership.firmId)
    .maybeSingle();

  return (
    <FirmLeadsDashboard
      firmId={membership.firmId}
      initialRows={rows}
      filters={filters}
      leadFeeCents={firm?.lead_fee_cents ?? null}
      stripeChargesEnabled={firm?.stripe_connect_charges_enabled ?? false}
    />
  );
}

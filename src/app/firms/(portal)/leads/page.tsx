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

  return (
    <FirmLeadsDashboard
      firmId={membership.firmId}
      initialRows={rows}
      filters={filters}
    />
  );
}

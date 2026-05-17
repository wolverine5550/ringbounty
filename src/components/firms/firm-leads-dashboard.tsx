"use client";

import { Suspense, useMemo } from "react";

import { FirmLeadFiltersForm } from "@/components/firms/firm-lead-filters-form";
import { FirmLeadsPaymentReturn } from "@/components/firms/firm-leads-payment-return";
import { FirmLeadsRealtime } from "@/components/firms/firm-leads-realtime";
import { FirmLeadsTable } from "@/components/firms/firm-leads-table";
import {
  applyFirmLeadFilters,
  type FirmLeadListRow,
} from "@/lib/firms/apply-firm-lead-filters";
import type { FirmLeadFilters } from "@/lib/firms/firm-lead-filters";

type FirmLeadsDashboardProps = {
  firmId: string;
  initialRows: FirmLeadListRow[];
  filters: FirmLeadFilters;
  leadFeeCents: number | null;
  stripeChargesEnabled: boolean;
};

export function FirmLeadsDashboard({
  firmId,
  initialRows,
  filters,
  leadFeeCents,
  stripeChargesEnabled,
}: FirmLeadsDashboardProps) {
  const filteredRows = useMemo(
    () => applyFirmLeadFilters(initialRows, filters),
    [initialRows, filters],
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-medium">Lead inbox</h2>
        <p className="text-sm text-muted-foreground">
          Accept a pool lead to pay the lead fee and unlock consumer contact
          details. Declined leads are hidden from your inbox only.
        </p>
        <Suspense fallback={null}>
          <FirmLeadsPaymentReturn />
        </Suspense>
        <FirmLeadsRealtime firmId={firmId} />
      </div>
      <FirmLeadFiltersForm initial={filters} />
      <FirmLeadsTable
        rows={filteredRows}
        firmId={firmId}
        leadFeeCents={leadFeeCents}
        stripeChargesEnabled={stripeChargesEnabled}
      />
    </div>
  );
}

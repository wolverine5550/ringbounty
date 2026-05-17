"use client";

import { useMemo } from "react";

import { FirmLeadFiltersForm } from "@/components/firms/firm-lead-filters-form";
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
};

export function FirmLeadsDashboard({
  firmId,
  initialRows,
  filters,
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
          Pool leads match your firm profile. Accept and pay flows ship in §13.5.
        </p>
        <FirmLeadsRealtime firmId={firmId} />
      </div>
      <FirmLeadFiltersForm initial={filters} />
      <FirmLeadsTable rows={filteredRows} firmId={firmId} />
    </div>
  );
}

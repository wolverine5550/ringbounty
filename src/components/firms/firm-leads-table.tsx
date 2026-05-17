import type { FirmLeadListRow } from "@/lib/firms/apply-firm-lead-filters";

function formatUsd(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type FirmLeadsTableProps = {
  rows: FirmLeadListRow[];
  firmId: string;
};

export function FirmLeadsTable({ rows, firmId }: FirmLeadsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No leads match your filters. New referrals appear here in real time when
        they match your firm criteria.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Created</th>
            <th className="px-3 py-2">State</th>
            <th className="px-3 py-2">Strength</th>
            <th className="px-3 py-2">Est. value</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const value =
              row.estimated_value_realistic_cents ??
              row.estimated_value_low_cents;
            const isAssigned = row.assigned_firm_id === firmId;
            const isPool = row.assigned_firm_id == null;

            return (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(row.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">{row.consumer_state ?? "—"}</td>
                <td className="px-3 py-2 capitalize">
                  {row.claim_strength ?? "—"}
                </td>
                <td className="px-3 py-2">{formatUsd(value)}</td>
                <td className="px-3 py-2 capitalize">{row.status}</td>
                <td className="px-3 py-2">
                  {isAssigned ? (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Assigned to you
                    </span>
                  ) : isPool ? (
                    <span className="text-sky-700 dark:text-sky-400">Pool</span>
                  ) : (
                    <span className="text-muted-foreground">Other</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

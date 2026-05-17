import {
  VALUATION_INFORMATIONAL_NOTE,
  VALUATION_SCENARIO_LABELS,
} from "@/lib/constants/results-strength";
import {
  formatUsdFromCents,
  type ValuationScenarios,
} from "@/lib/scoring/compute-valuation";

export type ResultsValuationPanelProps = {
  valuation: ValuationScenarios;
};

/**
 * Phase 8.4.2 — Three-scenario dollar display + mandatory caveat (PRD §11).
 */
export function ResultsValuationPanel({ valuation }: ResultsValuationPanelProps) {
  const rows = [
    {
      label: VALUATION_SCENARIO_LABELS.conservativeLow,
      amount: formatUsdFromCents(valuation.conservativeLowCents),
    },
    {
      label: VALUATION_SCENARIO_LABELS.conservativeHigh,
      amount: formatUsdFromCents(valuation.conservativeHighCents),
    },
    {
      label: VALUATION_SCENARIO_LABELS.realistic,
      amount: formatUsdFromCents(valuation.realisticCents),
    },
    {
      label: VALUATION_SCENARIO_LABELS.maximum,
      amount: formatUsdFromCents(valuation.maximumCents),
    },
  ];

  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <h2 className="text-sm font-medium">Estimated statutory ranges</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          {VALUATION_INFORMATIONAL_NOTE}
        </p>
      </div>

      <dl className="grid gap-2 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-b border-dashed pb-2 last:border-0 last:pb-0"
          >
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-medium tabular-nums">{row.amount}</dd>
          </div>
        ))}
      </dl>

      <p className="text-muted-foreground text-xs leading-relaxed">
        {valuation.displayCaveat}
      </p>
    </section>
  );
}

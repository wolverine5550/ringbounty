import type { ResultsStrengthDisplay } from "@/lib/constants/results-strength";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<ResultsStrengthDisplay["tone"], string> = {
  green: "border-emerald-500/40 bg-emerald-500/10",
  yellow: "border-amber-500/40 bg-amber-500/10",
  orange: "border-orange-500/40 bg-orange-500/10",
  red: "border-destructive/40 bg-destructive/10",
};

export type ResultsStrengthHeaderProps = {
  display: ResultsStrengthDisplay;
};

/**
 * Phase 8.4.3 — Claim-level strength band with likelihood copy.
 */
export function ResultsStrengthHeader({ display }: ResultsStrengthHeaderProps) {
  return (
    <section
      className={cn("rounded-lg border p-4", TONE_CLASSES[display.tone])}
      aria-labelledby="results-strength-headline"
    >
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        Claim strength — {display.label}
      </p>
      <h2
        id="results-strength-headline"
        className="mt-2 text-base font-semibold leading-snug"
      >
        {display.headline}
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">{display.body}</p>
    </section>
  );
}

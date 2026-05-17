import {
  SOL_LIKELY_TIME_BARRED_BODY,
  SOL_LIKELY_TIME_BARRED_TITLE,
} from "@/lib/constants/sol-warning";
import type { PersistedSolFlags } from "@/lib/scoring/sol-claim-events";

export type SolWarningBannerProps = {
  sol: PersistedSolFlags;
};

/**
 * Phase 8.2.3 — Informational banner when both SOL windows are expired (no hard block).
 */
export function SolWarningBanner({ sol }: SolWarningBannerProps) {
  if (!sol.likelyTimeBarred) {
    return null;
  }

  return (
    <section
      className="border-caution/40 bg-caution/10 text-caution-foreground rounded-lg border p-4"
      role="status"
    >
      <p className="text-sm font-medium">{SOL_LIKELY_TIME_BARRED_TITLE}</p>
      <p className="text-muted-foreground mt-2 text-sm">{SOL_LIKELY_TIME_BARRED_BODY}</p>
    </section>
  );
}

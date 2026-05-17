import { stateDncComingSoonMessage } from "@/lib/constants/state-dnc-unavailable";
import type { StateWithOwnDncRegistry } from "@/lib/constants/state-dnc-registries";

export type StateDncComingSoonProps = {
  stateCode: StateWithOwnDncRegistry;
};

/**
 * Phase 6.3.2 — Informational banner when state registry applies but API is deferred.
 */
export function StateDncComingSoon({ stateCode }: StateDncComingSoonProps) {
  return (
    <div
      className="border-caution/40 bg-caution/10 text-foreground rounded-md border px-4 py-3 text-sm"
      role="status"
    >
      {stateDncComingSoonMessage(stateCode)}
    </div>
  );
}

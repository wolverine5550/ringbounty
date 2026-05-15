import { CHECK_FLOW_STEPS, type CheckFlowStepId } from "@/lib/check/constants";
import { cn } from "@/lib/utils";

type CheckStepIndicatorProps = {
  /** Zero-based step index; only steps at or before this index are marked complete. */
  currentStep: CheckFlowStepId;
};

/**
 * Horizontal step progress for the check funnel (§4.1.2). Step 0 is evidence preservation (PRD §10).
 */
export function CheckStepIndicator({ currentStep }: CheckStepIndicatorProps) {
  return (
    <nav aria-label="Check progress" className="w-full">
      <ol className="flex gap-2">
        {CHECK_FLOW_STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isComplete = step.id < currentStep;
          const state = isActive ? "current" : isComplete ? "complete" : "upcoming";

          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-1 flex-col gap-1"
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={cn(
                  "text-muted-foreground block truncate text-center text-[10px] font-medium uppercase tracking-wide sm:text-xs",
                  isActive && "text-primary",
                  isComplete && "text-foreground",
                )}
              >
                Step {step.id}
              </span>
              <span
                className={cn(
                  "block truncate rounded-md border px-1 py-1.5 text-center text-[11px] font-medium leading-tight sm:px-2 sm:text-xs",
                  state === "current" &&
                    "border-primary bg-primary/10 text-primary",
                  state === "complete" &&
                    "border-border bg-muted/50 text-foreground",
                  state === "upcoming" &&
                    "border-dashed border-border text-muted-foreground",
                )}
              >
                {step.indicatorLabel}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

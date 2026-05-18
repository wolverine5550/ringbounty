import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Primary dashboard action — start a new number screen on `/check`.
 */
export function DashboardNewCheckCta() {
  return (
    <section
      className="flex flex-col gap-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-5"
      aria-labelledby="dashboard-new-check-heading"
    >
      <div className="flex items-start gap-3">
        <span
          className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full"
          aria-hidden
        >
          <Plus className="size-5" strokeWidth={2} />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            id="dashboard-new-check-heading"
            className="text-base font-medium leading-snug"
          >
            Screen another number
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Add another spam call to check. Each screen saves to your account so
            you can qualify and review results later.
          </p>
        </div>
      </div>
      <Button asChild className="w-full sm:w-auto">
        <Link href="/check">Check another number</Link>
      </Button>
    </section>
  );
}

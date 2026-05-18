"use client";

import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

import { CheckFunnelClient } from "@/components/check/check-funnel-client";
import { cn } from "@/lib/utils";

type DashboardCheckPanelProps = {
  className?: string;
};

/**
 * Compact new-check form for the dashboard sidebar (desktop) or top card (mobile).
 */
export function DashboardCheckPanel({ className }: DashboardCheckPanelProps) {
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 sm:p-6",
        className,
      )}
      aria-labelledby="dashboard-check-heading"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="dashboard-check-heading"
          className="text-lg font-semibold tracking-tight"
        >
          New check
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          U.S. numbers only — saved to your account when complete.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm" role="status">
            Loading…
          </p>
        }
      >
        <CheckFunnelClient
          key={formKey}
          variant="dashboard"
          onCheckSubmitted={() => {
            router.refresh();
            setFormKey((k) => k + 1);
          }}
        />
      </Suspense>
    </section>
  );
}

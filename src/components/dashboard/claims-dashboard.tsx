import { Search } from "lucide-react";

import { DashboardCheckPanel } from "@/components/dashboard/dashboard-check-panel";
import { DashboardClaimCard } from "@/components/dashboard/dashboard-claim-card";
import type { UserClaimsDashboard } from "@/lib/claims/load-user-claims-dashboard";

type ClaimsDashboardProps = {
  dashboard: UserClaimsDashboard;
};

/**
 * Signed-in dashboard: sidebar check form and past searches list.
 */
export function ClaimsDashboard({ dashboard }: ClaimsDashboardProps) {
  const { claims } = dashboard;
  const hasClaims = claims.length > 0;
  const searchCountLabel =
    claims.length === 1 ? "1 search" : `${claims.length} searches`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <DashboardCheckPanel className="lg:sticky lg:top-20 lg:self-start" />

      <section
        className="flex min-w-0 flex-col gap-5 rounded-xl border border-border/60 bg-muted/10 p-5 sm:p-6"
        aria-labelledby="dashboard-searches-heading"
      >
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="dashboard-searches-heading"
                className="text-lg font-semibold tracking-tight"
              >
                Your searches
              </h2>
              {hasClaims ? (
                <span className="bg-background text-muted-foreground rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">
                  {searchCountLabel}
                </span>
              ) : null}
            </div>
            <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
              {hasClaims
                ? "Strength, valuation, and next steps for each number you screened."
                : "Results appear here after you run a check."}
            </p>
          </div>
        </header>

        {hasClaims ? (
          <ul className="flex flex-col gap-2.5">
            {claims.map((claim) => (
              <DashboardClaimCard key={claim.claimId} claim={claim} />
            ))}
          </ul>
        ) : (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/80 bg-background/40 px-6 py-14 text-center">
            <span className="bg-muted flex size-11 items-center justify-center rounded-full">
              <Search className="size-5 opacity-60" aria-hidden />
            </span>
            <div className="flex max-w-xs flex-col gap-1">
              <p className="text-foreground text-sm font-medium">No searches yet</p>
              <p className="text-xs leading-relaxed">
                Enter a U.S. phone number on the left to run your first spam screen.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getClaimStatusDisplayLabel } from "@/lib/claims/claim-status-display";
import type { DashboardClaimSummary } from "@/lib/claims/load-user-claims-dashboard";
import { cn } from "@/lib/utils";

type DashboardClaimCardProps = {
  claim: DashboardClaimSummary;
};

function formatClaimDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

const STRENGTH_BADGE: Record<string, string> = {
  Strong: "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  Moderate:
    "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  Weak: "border-orange-500/40 bg-orange-500/10 text-orange-950 dark:text-orange-100",
  Ineligible:
    "border-destructive/40 bg-destructive/10 text-destructive",
};

/**
 * Single past-check row for the dashboard list.
 */
export function DashboardClaimCard({ claim }: DashboardClaimCardProps) {
  const company = claim.companyNames[0]?.trim();
  const phone = claim.phoneLabels[0];
  const showCompany = Boolean(company);
  const displayPhone = phone ?? "Number on file";

  return (
    <li className="group rounded-lg border border-border/70 bg-background/80 p-4 transition-colors hover:border-border hover:bg-background">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          {showCompany ? (
            <p className="truncate text-sm font-medium text-foreground">
              {company}
            </p>
          ) : null}
          <p
            className={cn(
              "font-mono tracking-tight text-foreground",
              showCompany ? "text-base" : "text-lg font-semibold",
            )}
          >
            {displayPhone}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {claim.strengthLabel ? (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs font-medium",
                  STRENGTH_BADGE[claim.strengthLabel] ??
                    "bg-muted text-muted-foreground",
                )}
              >
                {claim.strengthLabel}
              </span>
            ) : null}
            <span className="text-muted-foreground text-xs">
              {getClaimStatusDisplayLabel(claim.status)}
              <span className="text-muted-foreground/50 mx-1.5">·</span>
              Updated {formatClaimDate(claim.updatedAt)}
            </span>
          </div>
          {claim.phoneLabels.length > 1 ? (
            <p className="text-muted-foreground font-mono text-xs">
              +{claim.phoneLabels.length - 1} more number
              {claim.phoneLabels.length > 2 ? "s" : ""}:{" "}
              {claim.phoneLabels.slice(1).join(" · ")}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2 md:flex-col md:items-stretch">
          <Button asChild size="sm" className="flex-1 md:min-w-[8.5rem]">
            <Link href={claim.resultsHref}>View results</Link>
          </Button>
          {claim.qualifyHref ? (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex-1 md:min-w-[8.5rem]"
            >
              <Link href={claim.qualifyHref}>Continue</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

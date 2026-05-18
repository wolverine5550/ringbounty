import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { UserClaimsDashboard } from "@/lib/claims/load-user-claims-dashboard";

type ClaimsDashboardProps = {
  dashboard: UserClaimsDashboard;
};

function formatClaimDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

function statusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "In progress";
    case "qualified":
      return "Qualified";
    case "referred":
      return "Referred to attorney";
    default:
      return status.replaceAll("_", " ");
  }
}

/**
 * Lists the signed-in user's screened numbers with links to results / qualify.
 */
export function ClaimsDashboard({ dashboard }: ClaimsDashboardProps) {
  const { totalChecks, totalNumbers, claims } = dashboard;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Checks
          </p>
          <p className="text-2xl font-semibold tabular-nums">{totalChecks}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Numbers screened
          </p>
          <p className="text-2xl font-semibold tabular-nums">{totalNumbers}</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">Your searches</h2>
          <p className="text-muted-foreground text-sm">
            Open a check to see strength, valuation, and next steps. This is
            informational only — not legal advice.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {claims.map((claim) => (
            <li
              key={claim.claimId}
              className="flex flex-col gap-3 rounded-lg border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-sm font-medium">
                    {claim.companyNames[0] ??
                      claim.phoneLabels[0] ??
                      "Screened number"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Updated {formatClaimDate(claim.updatedAt)}
                    {claim.subjectCount > 1
                      ? ` · ${claim.subjectCount} numbers`
                      : null}
                  </p>
                  {claim.phoneLabels.length > 0 ? (
                    <p className="text-muted-foreground text-xs">
                      {claim.phoneLabels.join(" · ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-muted rounded-full px-2 py-0.5">
                    {statusLabel(claim.status)}
                  </span>
                  {claim.strengthLabel ? (
                    <span className="bg-muted rounded-full px-2 py-0.5">
                      {claim.strengthLabel}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="default">
                  <Link href={claim.resultsHref}>View results</Link>
                </Button>
                {claim.qualifyHref ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={claim.qualifyHref}>Continue qualifying</Link>
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="ghost">
                  <Link href="/check">Check another number</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

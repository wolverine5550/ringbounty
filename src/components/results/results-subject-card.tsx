import { Badge } from "@/components/ui/badge";
import type { ResultsSubjectView } from "@/lib/claims/load-results-page-context";
import type { ResultsStrengthTone } from "@/lib/constants/results-strength";
import { getResultsStrengthDisplay } from "@/lib/constants/results-strength";
import { cn } from "@/lib/utils";

const STRENGTH_BADGE_CLASSES: Record<ResultsStrengthTone, string> = {
  green: "border-emerald-600/30 bg-emerald-600/10 text-emerald-900 dark:text-emerald-100",
  yellow: "border-amber-600/30 bg-amber-600/10 text-amber-950 dark:text-amber-100",
  orange: "border-orange-600/30 bg-orange-600/10 text-orange-950 dark:text-orange-100",
  red: "border-destructive/30 bg-destructive/10 text-destructive",
};

export type ResultsSubjectCardProps = {
  subject: ResultsSubjectView;
  /** Tighter layout when shown beside claim-level strength on `/results`. */
  variant?: "default" | "compact";
  /** False before qualify — DNC comes from attestation in the wizard, not spam check. */
  showDncSummary?: boolean;
};

/**
 * Phase 8.4.1 — Per-subject evidence summary + strength / exempt badges.
 */
export function ResultsSubjectCard({
  subject,
  variant = "default",
  showDncSummary = true,
}: ResultsSubjectCardProps) {
  const isCompact = variant === "compact";
  const strengthTone = getResultsStrengthDisplay(subject.strength).tone;

  return (
    <article
      className={cn(
        "flex flex-col rounded-lg border bg-card/40",
        isCompact ? "gap-2 p-3" : "gap-3 p-4",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-sm font-medium">
            {subject.phoneNumber ??
              subject.companyName ??
              "Phone number on file"}
          </h3>
          {subject.companyName &&
          subject.phoneNumber &&
          subject.companyName !== subject.phoneNumber ? (
            <p className="text-muted-foreground text-xs">{subject.companyName}</p>
          ) : null}
        </div>
        {!isCompact ? (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn(STRENGTH_BADGE_CLASSES[strengthTone])}
            >
              {subject.strengthLabel}
            </Badge>
            {subject.isExempt ? (
              <Badge variant="secondary">Exempt</Badge>
            ) : null}
          </div>
        ) : subject.isExempt ? (
          <Badge variant="secondary" className="shrink-0">
            Exempt
          </Badge>
        ) : null}
      </div>

      {subject.isExempt && subject.exemptReason ? (
        <p className="text-muted-foreground text-xs">{subject.exemptReason}</p>
      ) : null}

      <dl className={cn("flex flex-col text-sm", isCompact ? "gap-1.5" : "gap-2")}>
        <div>
          <dt className="text-muted-foreground text-xs font-medium">Spam check</dt>
          <dd className="mt-0.5 text-xs leading-relaxed sm:text-sm">
            {subject.spamSummary}
          </dd>
        </div>
        {showDncSummary ? (
          <div>
            <dt className="text-muted-foreground text-xs font-medium">Do Not Call</dt>
            <dd className="mt-0.5 text-xs leading-relaxed sm:text-sm">
              {subject.dncSummary}
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

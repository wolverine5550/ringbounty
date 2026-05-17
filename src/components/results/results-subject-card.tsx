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
};

/**
 * Phase 8.4.1 — Per-subject evidence summary + strength / exempt badges.
 */
export function ResultsSubjectCard({ subject }: ResultsSubjectCardProps) {
  const strengthTone = getResultsStrengthDisplay(subject.strength).tone;

  return (
    <article className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-sm font-medium">
            {subject.companyName ?? subject.phoneNumber ?? "Phone number on file"}
          </h3>
          {subject.companyName && subject.phoneNumber ? (
            <p className="text-muted-foreground text-xs">{subject.phoneNumber}</p>
          ) : null}
        </div>
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
      </div>

      {subject.isExempt && subject.exemptReason ? (
        <p className="text-muted-foreground text-xs">{subject.exemptReason}</p>
      ) : null}

      <dl className="flex flex-col gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs font-medium">Spam check</dt>
          <dd className="mt-0.5">{subject.spamSummary}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs font-medium">Do Not Call</dt>
          <dd className="mt-0.5">{subject.dncSummary}</dd>
        </div>
      </dl>
    </article>
  );
}

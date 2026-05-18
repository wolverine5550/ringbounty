import type { ResultsStrengthDisplay } from "@/lib/constants/results-strength";
import type { ResultsSubjectView } from "@/lib/claims/load-results-page-context";

import { ResultsStrengthHeader } from "./results-strength-header";
import { ResultsSubjectCard } from "./results-subject-card";

export type ResultsStrengthAndSubjectsProps = {
  strengthDisplay: ResultsStrengthDisplay;
  subjects: ResultsSubjectView[];
  /** DNC rows come from qualify — hide on preliminary `/results`. */
  showDncSummary?: boolean;
};

/**
 * Claim-level strength beside per-number summaries (desktop two-column).
 */
export function ResultsStrengthAndSubjects({
  strengthDisplay,
  subjects,
  showDncSummary = true,
}: ResultsStrengthAndSubjectsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
      <ResultsStrengthHeader
        display={strengthDisplay}
        className="lg:min-h-full"
      />

      <section
        className="flex flex-col gap-2.5"
        aria-labelledby="results-numbers-heading"
      >
        <h2
          id="results-numbers-heading"
          className="text-sm font-medium lg:pt-1"
        >
          Numbers on this claim
        </h2>
        <div className="flex flex-col gap-2.5">
          {subjects.map((subject) => (
            <ResultsSubjectCard
              key={subject.subjectId}
              subject={subject}
              variant="compact"
              showDncSummary={showDncSummary}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

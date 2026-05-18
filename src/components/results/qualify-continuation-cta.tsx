import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  CHECK_CONTINUE_TO_QUALIFY_HELP,
  CHECK_CONTINUE_TO_QUALIFY_LABEL,
} from "@/lib/constants/no-spam-hit";

export type QualifyContinuationCtaProps = {
  qualifyHref: string;
  claimStatus: string;
};

/**
 * Shown on `/results` when the claim has not finished the qualification wizard.
 * Attorney referral is hidden until `claims.status === qualified`.
 */
export function QualifyContinuationCta({
  qualifyHref,
  claimStatus,
}: QualifyContinuationCtaProps) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <h2 className="text-sm font-medium">Next step</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        These results are based on your spam-database screen
        {claimStatus === "checking" ? " so far" : ""}. Answer a short set of
        questions about your calls and Do Not Call status before connecting with
        an attorney.
      </p>
      <p className="text-muted-foreground text-xs leading-relaxed">
        {CHECK_CONTINUE_TO_QUALIFY_HELP}
      </p>
      <Button asChild className="w-full sm:w-auto">
        <Link href={qualifyHref}>{CHECK_CONTINUE_TO_QUALIFY_LABEL}</Link>
      </Button>
    </section>
  );
}

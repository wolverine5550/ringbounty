import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { LandingSection } from "@/components/marketing/landing-section";
import { Button } from "@/components/ui/button";
import {
  LANDING_PROBLEM_POINTS,
  LANDING_SOLUTION_POINTS,
} from "@/lib/marketing/landing-content";

/** Problem → solution two-column section (wireframe H2 band). */
export function LandingProblemSolution() {
  return (
    <LandingSection
      id="why-ringbounty"
      title="Why consumers use RingBounty"
      description="Identify the problem, understand your options, and take a structured next step — without us promising any outcome."
    >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-6">
          <ul className="flex flex-col gap-4">
            {LANDING_PROBLEM_POINTS.map((point) => (
              <li
                key={point.slice(0, 40)}
                className="text-muted-foreground text-sm leading-relaxed sm:text-base"
              >
                {point}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="w-fit">
            <Link href="/how-it-works">See how it works</Link>
          </Button>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-muted/30 p-8">
          <div className="bg-primary text-primary-foreground flex h-14 w-14 items-center justify-center rounded-xl">
            <ShieldCheck className="h-7 w-7" aria-hidden />
          </div>
          <h3 className="text-lg font-medium">Informational, self-directed path</h3>
          <ul className="flex flex-col gap-3">
            {LANDING_SOLUTION_POINTS.map((point) => (
              <li
                key={point.slice(0, 40)}
                className="text-muted-foreground text-sm leading-relaxed"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </LandingSection>
  );
}

import Link from "next/link";

import { LandingSection } from "@/components/marketing/landing-section";
import { Button } from "@/components/ui/button";
import { FAQ_ENTRIES } from "@/lib/marketing/faq";
import { LANDING_FAQ_SECTION_ID } from "@/lib/marketing/landing-content";

/** Homepage FAQ accordion (wireframe) — links to full `/faq`. */
export function LandingFaqPreview() {
  return (
    <LandingSection
      id={LANDING_FAQ_SECTION_ID}
      title="Frequently asked questions"
      description="Quick answers about cost, legality, outcomes, and DIY letters."
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {FAQ_ENTRIES.map((entry) => (
          <details
            key={entry.id}
            className="group rounded-lg border border-border bg-card px-4 py-1 shadow-sm open:shadow-md"
          >
            <summary className="cursor-pointer list-none py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {entry.question}
                <span
                  className="text-muted-foreground text-lg leading-none transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </span>
            </summary>
            <p className="text-muted-foreground border-t border-border pb-4 pt-2 text-sm leading-relaxed">
              {entry.answer}
            </p>
          </details>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Button asChild variant="outline">
          <Link href="/faq">View all FAQ</Link>
        </Button>
      </div>
    </LandingSection>
  );
}

import Image from "next/image";
import Link from "next/link";

import { LandingSection } from "@/components/marketing/landing-section";
import { Button } from "@/components/ui/button";
import { LANDING_RISK_REDUCERS } from "@/lib/marketing/landing-content";

/** Full-width primary CTA band (wireframe). */
export function LandingCtaBand() {
  return (
    <LandingSection variant="muted" aria-label="Get started">
      <div className="grid items-center gap-8 rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-12 lg:grid-cols-[1fr_auto] lg:gap-12">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to screen your first number?
          </h2>
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed sm:text-base">
            Start with a free check. If the facts look promising, continue to qualify
            and optionally purchase a DIY demand letter — on your timeline, with clear
            informational disclaimers at every step.
          </p>
          <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {LANDING_RISK_REDUCERS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-start gap-4 lg:items-center">
          <div className="relative hidden h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border sm:block">
            <Image
              src="/opengraph-image.png"
              alt=""
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/check">Check a number — free</Link>
          </Button>
        </div>
      </div>
    </LandingSection>
  );
}

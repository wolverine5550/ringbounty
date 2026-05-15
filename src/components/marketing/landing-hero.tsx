import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Landing hero (§3.1.1): problem, informational TCPA framing, primary/secondary CTAs.
 */
export function LandingHero() {
  return (
    <section
      className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-16 text-center sm:py-20"
      aria-labelledby="landing-hero-heading"
    >
      <p className="text-primary text-sm font-medium uppercase tracking-wide">
        Consumer rights · TCPA information
      </p>
      <h1
        id="landing-hero-heading"
        className="text-3xl font-semibold tracking-tight sm:text-4xl sm:leading-tight"
      >
        Spam calls may carry statutory damages under federal law
      </h1>
      <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
        Billions of robocalls hit U.S. phones every year. The Telephone Consumer
        Protection Act (TCPA) sets statutory damages for many illegal calls — often
        $500–$1,500 per violation when the facts fit. RingBounty helps you{" "}
        <strong className="font-medium text-foreground">
          learn what the law generally says
        </strong>
        , screen numbers, and prepare a DIY demand letter. We share information only;
        we do not evaluate your case or promise any outcome.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href="/check">Check a number</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/how-it-works">How it works</Link>
        </Button>
      </div>
    </section>
  );
}

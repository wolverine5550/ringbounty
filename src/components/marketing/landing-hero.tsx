import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LANDING_RISK_REDUCERS } from "@/lib/marketing/landing-content";

/**
 * Landing hero (§3.1): two-column wireframe — H1, value prop, primary CTA + hero visual.
 */
export function LandingHero() {
  return (
    <section
      className="border-b border-border bg-background px-4 py-14 sm:py-20"
      aria-labelledby="landing-hero-heading"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-6">
          <p className="text-primary text-sm font-medium uppercase tracking-wide">
            Consumer rights · TCPA information
          </p>
          <h1
            id="landing-hero-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl sm:leading-tight lg:text-5xl"
          >
            Spam calls may carry statutory damages under federal law
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
            Billions of robocalls hit U.S. phones every year. RingBounty helps you
            learn what the TCPA generally says, screen numbers for free, and see whether
            an attorney connection may be worth exploring — informational tools only,
            not legal representation.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-fit">
              <Link href="/check">Check a number — free</Link>
            </Button>
            <ul className="text-muted-foreground flex flex-col gap-1 text-xs sm:text-sm">
              {LANDING_RISK_REDUCERS.map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <span
                    className="bg-success h-1.5 w-1.5 shrink-0 rounded-full"
                    aria-hidden
                  />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-sm lg:aspect-square">
          <Image
            src="/opengraph-image.png"
            alt="RingBounty — TCPA screening and attorney connection"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}

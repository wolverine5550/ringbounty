import type { Metadata } from "next";
import Link from "next/link";

import { DisclaimerBlock } from "@/components/marketing/disclaimer-block";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingPageFooter } from "@/components/marketing/marketing-page-footer";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_MARKETING_DESCRIPTION,
  SITE_NAME,
} from "@/lib/marketing/constants";
import { LANDING_FLOW_STEPS } from "@/lib/marketing/landing-content";

export const metadata: Metadata = {
  title: `How it works — ${SITE_NAME}`,
  description:
    "Informational overview of the RingBounty flow: check a number, qualify, pay for a letter, and file yourself — general TCPA information only.",
  openGraph: {
    title: `How ${SITE_NAME} works`,
    description: DEFAULT_MARKETING_DESCRIPTION,
    type: "website",
    images: [{ url: "/opengraph-image.png", alt: `${SITE_NAME} preview` }],
  },
};

/** How-it-works page (Phase §3.2). */
export default function HowItWorksPage() {
  return (
    <>
      <MarketingHeader />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-10 flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">How it works</h1>
          <p className="text-muted-foreground leading-relaxed">
            RingBounty is an informational tool for U.S. consumers exploring TCPA
            rights. The steps below describe the product flow — not legal advice and
            not a guarantee of any recovery.
          </p>
        </header>

        <ol className="flex flex-col gap-8">
          {LANDING_FLOW_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span
                className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium"
                aria-hidden
              >
                {index + 1}
              </span>
              <div>
                <h2 className="text-lg font-medium">{step.title}</h2>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <section
          className="mt-12 flex flex-col gap-3"
          aria-labelledby="tcpa-overview-heading"
        >
          <h2 id="tcpa-overview-heading" className="text-xl font-medium">
            TCPA overview (informational)
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The Telephone Consumer Protection Act restricts many autodialed or
            prerecorded calls and texts to cell phones, and sets statutory damages
            when violations occur. Whether a specific call qualifies depends on the
            facts — consent, exemptions, registries, and timing. RingBounty surfaces
            general legal background and tools to organize your facts; we do not tell
            you that you will win or how much you will recover.
          </p>
          <p className="text-sm">
            <Link
              href="/faq"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Read the FAQ
            </Link>{" "}
            for common questions about cost, timing, and DIY letters.
          </p>
        </section>

        <section className="mt-10 flex flex-col gap-4">
          <DisclaimerBlock />
          <Button asChild className="w-fit">
            <Link href="/check">Start with a number check</Link>
          </Button>
        </section>
      </article>
      <MarketingPageFooter />
    </>
  );
}

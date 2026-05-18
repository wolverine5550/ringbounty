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
import {
  FIRMS_LANDING_COMING_SOON,
  FIRMS_LANDING_HERO,
  FIRMS_LANDING_STEPS,
  FIRMS_LANDING_VALUE_PROPS,
} from "@/lib/marketing/firms-landing-content";

export const metadata: Metadata = {
  title: `For law firms — ${SITE_NAME}`,
  description:
    "Informational overview for attorneys and law firms: pre-screened TCPA referral leads with structured evidence packages.",
  openGraph: {
    title: `Law firms — ${SITE_NAME}`,
    description: DEFAULT_MARKETING_DESCRIPTION,
    type: "website",
    images: [{ url: "/opengraph-image.png", alt: `${SITE_NAME} preview` }],
  },
};

/**
 * Public firm value proposition (§13 GTM). Portal sign-in deferred — `/firms/login` redirects here.
 */
export default function FirmsLandingPage() {
  return (
    <>
      <MarketingHeader />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-10 flex flex-col gap-3">
          <p className="text-primary text-sm font-medium tracking-wide uppercase">
            For law firms &amp; attorneys
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {FIRMS_LANDING_HERO.title}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {FIRMS_LANDING_HERO.subtitle}
          </p>
        </header>

        <section
          className="mb-10 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-relaxed"
          aria-live="polite"
        >
          <p className="font-medium">Portal access</p>
          <p className="text-muted-foreground mt-2">{FIRMS_LANDING_COMING_SOON}</p>
        </section>

        <section className="mb-12 grid gap-6 sm:grid-cols-2">
          {FIRMS_LANDING_VALUE_PROPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="rounded-lg border border-border p-4"
              >
                <Icon
                  className="text-primary mb-3 h-6 w-6"
                  aria-hidden
                />
                <h2 className="font-medium">{item.title}</h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {item.description}
                </p>
                </div>
            );
          })}
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">
            How firm referrals work
          </h2>
          <ol className="flex flex-col gap-8">
            {FIRMS_LANDING_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-medium">{step.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-10 flex flex-col gap-3 rounded-lg border p-6">
          <h2 className="text-lg font-medium">Interested in participating?</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Email us to discuss onboarding, lead criteria, and pricing. We are not
            a law firm and do not provide legal advice to consumers or firms.
          </p>
          <Button asChild className="w-fit">
            <Link href="mailto:hello@ringbounty.com?subject=Firm%20onboarding">
              Contact RingBounty
            </Link>
          </Button>
        </section>

        <DisclaimerBlock />
      </article>
      <MarketingPageFooter />
    </>
  );
}

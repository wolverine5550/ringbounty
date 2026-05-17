import Link from "next/link";

import { DisclaimerBlock } from "@/components/marketing/disclaimer-block";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingPageFooter } from "@/components/marketing/marketing-page-footer";
import { SeoFaqJsonLd } from "@/components/marketing/seo-faq-json-ld";
import { Button } from "@/components/ui/button";
import type { SeoLandingPageConfig } from "@/lib/marketing/seo-landing-pages";
import { SEO_RESOURCE_LINKS } from "@/lib/marketing/seo-landing-pages";

type SeoLandingPageProps = {
  config: SeoLandingPageConfig;
};

/** Shared layout for §11.2 SEO landing pages. */
export function SeoLandingPage({ config }: SeoLandingPageProps) {
  const related = SEO_RESOURCE_LINKS.filter((link) => link.href !== config.pathname);

  return (
    <>
      {config.faq ? (
        <SeoFaqJsonLd pathname={config.pathname} faq={config.faq} />
      ) : null}
      <MarketingHeader />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-8 flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">{config.h1}</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {config.intro}
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {config.bodyParagraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="text-muted-foreground leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {config.faq && config.faq.length > 0 ? (
          <section className="mt-10" aria-labelledby="seo-faq-heading">
            <h2 id="seo-faq-heading" className="mb-4 text-xl font-semibold">
              Common questions
            </h2>
            <dl className="flex flex-col gap-6">
              {config.faq.map((item) => (
                <div key={item.question}>
                  <dt className="font-medium">{item.question}</dt>
                  <dd className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link href="/check">Check your number — free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/how-it-works">How it works</Link>
          </Button>
        </div>

        {related.length > 0 ? (
          <nav
            className="mt-12 border-t border-border pt-8"
            aria-label="Related resources"
          >
            <p className="mb-3 text-sm font-medium">Related resources</p>
            <ul className="flex flex-col gap-2">
              {related.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-primary text-sm hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <section className="mt-10">
          <DisclaimerBlock />
        </section>
      </article>
      <MarketingPageFooter />
    </>
  );
}

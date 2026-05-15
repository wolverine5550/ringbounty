import type { ReactNode } from "react";

import { DisclaimerBlock } from "@/components/marketing/disclaimer-block";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingPageFooter } from "@/components/marketing/marketing-page-footer";

type MarketingDocPageProps = {
  title: string;
  intro?: string;
  children: ReactNode;
};

/** Shared shell for FAQ, privacy, and terms (Phase §3.3–3.5). */
export function MarketingDocPage({
  title,
  intro,
  children,
}: MarketingDocPageProps) {
  return (
    <>
      <MarketingHeader />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-10 flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {intro ? (
            <p className="text-muted-foreground leading-relaxed">{intro}</p>
          ) : null}
        </header>
        {children}
        <section className="mt-10">
          <DisclaimerBlock />
        </section>
      </article>
      <MarketingPageFooter />
    </>
  );
}

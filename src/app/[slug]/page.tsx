import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DisclaimerBlock } from "@/components/marketing/disclaimer-block";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingPageFooter } from "@/components/marketing/marketing-page-footer";
import { Button } from "@/components/ui/button";
import { PRODUCT_DISCLAIMER } from "@/lib/marketing/constants";
import {
  companySpamCallsPath,
  getCompanySeoPage,
  parseCompanySpamCallsPath,
} from "@/lib/seo/company-pages";
import { buildSeoPageMetadata } from "@/lib/seo/seo-page-metadata";

type CompanySpamCallsPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Dynamic company SEO template (§11.1.3 / §11.3).
 * Returns 404 until the company is registered in `COMPANY_SEO_PAGES`.
 */
export async function generateMetadata({
  params,
}: CompanySpamCallsPageProps) {
  await connection();
  const { slug: pathSegment } = await params;
  const companySlug = parseCompanySpamCallsPath(pathSegment);
  if (!companySlug) {
    return {};
  }

  const page = getCompanySeoPage(companySlug);
  if (!page) {
    return {};
  }

  const pathname = companySpamCallsPath(companySlug);
  return buildSeoPageMetadata({
    pathname,
    title: `${page.displayName} spam calls`,
    description: `${page.intro.slice(0, 155)}…`,
  });
}

export default function CompanySpamCallsPage({ params }: CompanySpamCallsPageProps) {
  return (
    <Suspense
      fallback={
        <p className="text-muted-foreground mx-auto max-w-3xl px-4 py-12 text-sm">
          Loading…
        </p>
      }
    >
      <CompanySpamCallsPageContent params={params} />
    </Suspense>
  );
}

async function CompanySpamCallsPageContent({ params }: CompanySpamCallsPageProps) {
  await connection();
  const { slug: pathSegment } = await params;
  const companySlug = parseCompanySpamCallsPath(pathSegment);
  if (!companySlug) {
    notFound();
  }

  const page = getCompanySeoPage(companySlug);
  if (!page) {
    notFound();
  }

  return (
    <>
      <MarketingHeader />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-8 flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            {page.displayName} spam calls and TCPA screening
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {page.intro}
          </p>
        </header>

        <p className="text-muted-foreground leading-relaxed">{PRODUCT_DISCLAIMER}</p>

        <div className="mt-10">
          <Button asChild size="lg">
            <Link href="/check">Check a number — free</Link>
          </Button>
        </div>

        <section className="mt-10">
          <DisclaimerBlock />
        </section>
      </article>
      <MarketingPageFooter />
    </>
  );
}

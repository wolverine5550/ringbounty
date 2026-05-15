import type { Metadata } from "next";

import { DisclaimerBlock } from "@/components/marketing/disclaimer-block";
import { LandingHero } from "@/components/marketing/landing-hero";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingPageFooter } from "@/components/marketing/marketing-page-footer";
import { TrustStrip } from "@/components/marketing/trust-strip";
import {
  DEFAULT_MARKETING_DESCRIPTION,
  SITE_NAME,
} from "@/lib/marketing/constants";

export const metadata: Metadata = {
  title: `${SITE_NAME} — TCPA information and DIY demand letters`,
  description: DEFAULT_MARKETING_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} — Understand spam-call rights under TCPA`,
    description: DEFAULT_MARKETING_DESCRIPTION,
    type: "website",
    images: [{ url: "/opengraph-image.png", alt: `${SITE_NAME} preview` }],
  },
};

/** Public landing page (Phase §3.1). */
export default function HomePage() {
  return (
    <>
      <MarketingHeader />
      <LandingHero />
      <TrustStrip />
      <section className="mx-auto max-w-3xl px-4 py-12">
        <DisclaimerBlock />
      </section>
      <MarketingPageFooter />
    </>
  );
}

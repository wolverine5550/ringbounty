import type { Metadata } from "next";

import { DisclaimerBlock } from "@/components/marketing/disclaimer-block";
import { LandingCtaBand } from "@/components/marketing/landing-cta-band";
import { LandingFaqPreview } from "@/components/marketing/landing-faq-preview";
import { LandingFeatures } from "@/components/marketing/landing-features";
import { LandingHowItWorks } from "@/components/marketing/landing-how-it-works";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingIntegrations } from "@/components/marketing/landing-integrations";
import { LandingProblemSolution } from "@/components/marketing/landing-problem-solution";
import { LandingTrustStats } from "@/components/marketing/landing-trust-stats";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingPageFooter } from "@/components/marketing/marketing-page-footer";
import {
  DEFAULT_MARKETING_DESCRIPTION,
  SITE_NAME,
} from "@/lib/marketing/constants";

export const metadata: Metadata = {
  title: `${SITE_NAME} — TCPA screening and attorney connection`,
  description: DEFAULT_MARKETING_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} — Understand spam-call rights under TCPA`,
    description: DEFAULT_MARKETING_DESCRIPTION,
    type: "website",
    images: [{ url: "/opengraph-image.png", alt: `${SITE_NAME} preview` }],
  },
};

/** Public landing page — wireframe-aligned homepage (§3.1). */
export default function HomePage() {
  return (
    <>
      <MarketingHeader />
      <LandingHero />
      <LandingTrustStats />
      <LandingProblemSolution />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingIntegrations />
      <LandingCtaBand />
      <LandingFaqPreview />
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <DisclaimerBlock />
      </section>
      <MarketingPageFooter />
    </>
  );
}

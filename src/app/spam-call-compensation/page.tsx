import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { SEO_LANDING_PAGES } from "@/lib/marketing/seo-landing-pages";
import { buildSeoPageMetadata } from "@/lib/seo/seo-page-metadata";

const config = SEO_LANDING_PAGES["/spam-call-compensation"];

export function generateMetadata() {
  return buildSeoPageMetadata({
    pathname: config.pathname,
    title: config.title,
    description: config.metaDescription,
  });
}

/** §11.2.2 — Spam call compensation SEO landing. */
export default function SpamCallCompensationPage() {
  return <SeoLandingPage config={config} />;
}

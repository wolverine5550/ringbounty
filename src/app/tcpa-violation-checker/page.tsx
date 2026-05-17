import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { SEO_LANDING_PAGES } from "@/lib/marketing/seo-landing-pages";
import { buildSeoPageMetadata } from "@/lib/seo/seo-page-metadata";

const config = SEO_LANDING_PAGES["/tcpa-violation-checker"];

export function generateMetadata() {
  return buildSeoPageMetadata({
    pathname: config.pathname,
    title: config.title,
    description: config.metaDescription,
  });
}

/** §11.2.1 — TCPA violation checker SEO landing. */
export default function TcpaViolationCheckerPage() {
  return <SeoLandingPage config={config} />;
}

import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { SEO_LANDING_PAGES } from "@/lib/marketing/seo-landing-pages";
import { buildSeoPageMetadata } from "@/lib/seo/seo-page-metadata";

const config = SEO_LANDING_PAGES["/do-not-call-registry-violation"];

export function generateMetadata() {
  return buildSeoPageMetadata({
    pathname: config.pathname,
    title: config.title,
    description: config.metaDescription,
  });
}

/** §11.2.3 — Do Not Call registry violation SEO landing. */
export default function DoNotCallRegistryViolationPage() {
  return <SeoLandingPage config={config} />;
}

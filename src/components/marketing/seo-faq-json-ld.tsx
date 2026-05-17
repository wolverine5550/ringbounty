import type { SeoLandingFaqItem } from "@/lib/marketing/seo-landing-pages";
import { canonicalAbsoluteUrl } from "@/lib/seo/canonical-metadata";

type SeoFaqJsonLdProps = {
  pathname: string;
  faq: readonly SeoLandingFaqItem[];
};

/**
 * Optional FAQPage structured data for SEO landings (§11.2.1).
 */
export function SeoFaqJsonLd({ pathname, faq }: SeoFaqJsonLdProps) {
  if (faq.length === 0) {
    return null;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    url: canonicalAbsoluteUrl(pathname),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

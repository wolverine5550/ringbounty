import type { Metadata } from "next";

import { SITE_NAME } from "@/lib/marketing/constants";

import { buildCanonicalMetadata } from "./canonical-metadata";

export type SeoPageMetadataInput = {
  pathname: string;
  title: string;
  description: string;
};

/** Shared metadata builder for SEO landing and company pages. */
export function buildSeoPageMetadata(input: SeoPageMetadataInput): Metadata {
  const base = buildCanonicalMetadata({
    pathname: input.pathname,
    description: input.description,
  });

  return {
    ...base,
    title: `${input.title} — ${SITE_NAME}`,
    openGraph: {
      title: `${input.title} — ${SITE_NAME}`,
      description: input.description,
      type: "website",
      images: [{ url: "/opengraph-image.png", alt: `${SITE_NAME} preview` }],
    },
  };
}

import type { Metadata } from "next";
import Link from "next/link";

import { FaqList } from "@/components/marketing/faq-list";
import { MarketingDocPage } from "@/components/marketing/marketing-doc-page";
import { Button } from "@/components/ui/button";
import { FAQ_ENTRIES } from "@/lib/marketing/faq";
import {
  DEFAULT_MARKETING_DESCRIPTION,
  SITE_NAME,
} from "@/lib/marketing/constants";

export const metadata: Metadata = {
  title: `FAQ — ${SITE_NAME}`,
  description:
    "Answers about cost, legality, outcomes, timing, Do Not Call, and attorneys — general TCPA information only.",
  openGraph: {
    title: `${SITE_NAME} FAQ`,
    description: DEFAULT_MARKETING_DESCRIPTION,
    type: "website",
    images: [{ url: "/opengraph-image.png", alt: `${SITE_NAME} preview` }],
  },
};

/** FAQ page (Phase §3.3). */
export default function FaqPage() {
  return (
    <MarketingDocPage
      title="Frequently asked questions"
      intro="Common questions about RingBounty, TCPA screening, and attorney connection. Answers are educational — not a substitute for advice from a licensed attorney."
    >
      <FaqList entries={FAQ_ENTRIES} />
      <div className="mt-10">
        <Button asChild className="w-fit">
          <Link href="/check">Check a number</Link>
        </Button>
      </div>
    </MarketingDocPage>
  );
}

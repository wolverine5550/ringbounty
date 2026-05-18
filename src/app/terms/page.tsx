import type { Metadata } from "next";

import { LegalSections } from "@/components/marketing/legal-sections";
import { MarketingDocPage } from "@/components/marketing/marketing-doc-page";
import { TERMS_SECTIONS } from "@/lib/marketing/terms";
import { SITE_NAME } from "@/lib/marketing/constants";

export const metadata: Metadata = {
  title: `Terms of service — ${SITE_NAME}`,
  description:
    "Terms for using RingBounty: eligibility, acceptable use, attorney connection and lead sharing, and limitation of liability.",
};

/** Terms of service (Phase §3.5). Draft for legal review. */
export default function TermsPage() {
  return (
    <MarketingDocPage
      title="Terms of service"
      intro="Last updated: May 2026. By using RingBounty you agree to these terms. This draft is subject to counsel review."
    >
      <LegalSections sections={TERMS_SECTIONS} />
    </MarketingDocPage>
  );
}

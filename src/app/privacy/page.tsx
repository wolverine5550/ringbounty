import type { Metadata } from "next";

import { LegalSections } from "@/components/marketing/legal-sections";
import { MarketingDocPage } from "@/components/marketing/marketing-doc-page";
import { PRIVACY_SECTIONS } from "@/lib/marketing/privacy";
import { SITE_NAME } from "@/lib/marketing/constants";

export const metadata: Metadata = {
  title: `Privacy policy — ${SITE_NAME}`,
  description:
    "What RingBounty collects, why, retention, third parties, CCPA rights, and anonymous vs signed-in data.",
};

/** Privacy policy (Phase §3.4). Draft for legal review. */
export default function PrivacyPage() {
  return (
    <MarketingDocPage
      title="Privacy policy"
      intro="Last updated: May 2026. This plain-English summary describes how RingBounty handles personal information. A lawyer-reviewed version may replace this text before general availability."
    >
      <LegalSections sections={PRIVACY_SECTIONS} />
    </MarketingDocPage>
  );
}

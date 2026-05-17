/**
 * Phase 11.2 — Core SEO landing page copy (informational TCPA framing only).
 */

import { SEO_LANDING_PATHS } from "@/lib/seo/sitemap-routes";

export type SeoLandingFaqItem = {
  question: string;
  answer: string;
};

export type SeoLandingPageConfig = {
  pathname: (typeof SEO_LANDING_PATHS)[number];
  title: string;
  h1: string;
  metaDescription: string;
  intro: string;
  bodyParagraphs: readonly string[];
  faq?: readonly SeoLandingFaqItem[];
};

export const SEO_LANDING_PAGES: Record<
  SeoLandingPageConfig["pathname"],
  SeoLandingPageConfig
> = {
  "/tcpa-violation-checker": {
    pathname: "/tcpa-violation-checker",
    title: "TCPA violation checker",
    h1: "Free TCPA violation checker for unwanted calls",
    metaDescription:
      "Screen spam and robocall numbers for general TCPA factors — informational only, not legal advice. Start with a free check.",
    intro:
      "If you receive repeated robocalls, telemarketing texts, or prerecorded messages, federal law may impose rules on how callers contact you. RingBounty helps you organize what happened and see whether your facts might be worth discussing with a licensed attorney.",
    bodyParagraphs: [
      "Our checker looks at signals such as call category, Do Not Call attestations, stop-request answers, and call timing — then shows an informational strength estimate. We do not guarantee any outcome or recommend a specific demand amount.",
      "When screening looks promising, you can continue through qualification and optionally request a free attorney introduction. RingBounty is not a law firm and does not provide legal advice.",
    ],
    faq: [
      {
        question: "Does a positive screen mean I will win money?",
        answer:
          "No. Screening only highlights factors that sometimes appear in TCPA discussions. Outcomes depend on your specific facts, defenses, and court decisions.",
      },
      {
        question: "Is RingBounty a law firm?",
        answer:
          "No. We provide informational tools and optional attorney introductions. For advice about your situation, consult a licensed attorney.",
      },
    ],
  },
  "/spam-call-compensation": {
    pathname: "/spam-call-compensation",
    title: "Spam call compensation information",
    h1: "Understanding spam call compensation under federal law",
    metaDescription:
      "Learn how statutory damages are generally discussed in TCPA cases — informational estimates only. Free number screening.",
    intro:
      "Consumers often search for spam call compensation after unwanted robocalls or texts. The Telephone Consumer Protection Act (TCPA) is frequently discussed in that context, but every case depends on its own facts.",
    bodyParagraphs: [
      "RingBounty shows conservative, realistic, and maximum informational estimate bands based on your qualification answers. These figures illustrate how attorneys sometimes frame damages — they are not promises of payment.",
      "Start with a free check to screen your number, then complete qualification if you want a clearer picture before speaking with counsel.",
    ],
  },
  "/do-not-call-registry-violation": {
    pathname: "/do-not-call-registry-violation",
    title: "Do Not Call registry violation",
    h1: "Do Not Call registry violations and unwanted calls",
    metaDescription:
      "Information about federal Do Not Call attestations and TCPA screening — not a government registry lookup service.",
    intro:
      "Listing your number on the National Do Not Call Registry is an important consumer step, but RingBounty does not query the registry on your behalf. During qualification you attest whether your number was registered and when, which may affect how your claim is discussed.",
    bodyParagraphs: [
      "Violations of Do Not Call rules are often analyzed together with robocall, consent, and stop-request facts. Our screening combines those answers with spam reputation signals to produce an informational strength score.",
      "This page is educational only. For legal advice about registry status or remedies, consult a licensed attorney.",
    ],
  },
  "/robocall-lawsuit": {
    pathname: "/robocall-lawsuit",
    title: "Robocall lawsuit information",
    h1: "Robocall lawsuits: what consumers often ask",
    metaDescription:
      "General information about robocall lawsuits and TCPA screening — connect with an attorney when appropriate. Not legal advice.",
    intro:
      "A robocall lawsuit usually requires specific facts: autodialed or prerecorded calls, identification of the caller, and compliance with federal rules. RingBounty helps you organize evidence before you speak with counsel.",
    bodyParagraphs: [
      "After you check a number and complete qualification, we show an informational claim strength result and, when appropriate, a free option to connect with a participating attorney. We do not file lawsuits for you and do not promise representation.",
      "If your screening is ineligible, we explain why in plain language and may offer email updates — without guaranteeing any future product.",
    ],
  },
};

export const SEO_RESOURCE_LINKS = SEO_LANDING_PATHS.map((pathname) => {
  const page = SEO_LANDING_PAGES[pathname];
  return { href: pathname, label: page.title };
});

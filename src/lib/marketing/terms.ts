import type { LegalSection } from "./privacy";

/** Terms of service sections (Phase §3.5). Marked for lawyer review. */
export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    id: "not-legal-advice",
    title: "Not legal advice",
    paragraphs: [
      "RingBounty is not a law firm. The site, tools, and generated letters are for general informational and self-help purposes only. Nothing on RingBounty is a substitute for advice from a licensed attorney about your specific situation.",
    ],
  },
  {
    id: "eligibility",
    title: "Who may use the service",
    paragraphs: [
      "You must be at least 18 years old and located in the United States to use RingBounty. By using the service you represent that you meet these requirements.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    paragraphs: [
      "You agree not to misuse the platform: no automated scraping beyond normal use, no submitting phone numbers you do not have a good-faith reason to investigate, no harassment, and no attempts to bypass rate limits or security controls.",
      "You are responsible for the accuracy of information you provide. Falsified facts in a demand letter may undermine your position and could have legal consequences.",
    ],
  },
  {
    id: "digital-product",
    title: "Letters and digital purchases",
    paragraphs: [
      "When you purchase a demand letter, you receive a digital document generated from the facts you entered. Delivery is via download or account access — no physical goods ship.",
      "Statutory amount options (e.g. conservative, realistic, maximum) are presented for your choice; RingBounty does not recommend which amount to demand.",
    ],
  },
  {
    id: "refunds",
    title: "Refunds",
    paragraphs: [
      "Letter purchases are final once generation has started or the PDF has been delivered, except where required by applicable law. If you believe there was a technical failure preventing delivery, contact support@ringbounty.com within 14 days with your order details.",
    ],
  },
  {
    id: "liability",
    title: "Limitation of liability",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, RINGBOUNTY AND ITS AFFILIATES PROVIDE THE SERVICE “AS IS” WITHOUT WARRANTIES OF ANY KIND. WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, OR FOR ANY LOSS ARISING FROM YOUR USE OF GENERATED LETTERS OR SCREENING RESULTS.",
      "Our total liability for any claim relating to the service is limited to the greater of (a) amounts you paid to RingBounty in the twelve months before the claim or (b) one hundred U.S. dollars ($100). Some jurisdictions do not allow certain limitations; in those cases our liability is limited to the fullest extent permitted by law.",
      "This section is a draft for counsel review and may be updated before general availability.",
    ],
  },
  {
    id: "jurisdiction",
    title: "Governing law",
    paragraphs: [
      "These terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-law rules, except where mandatory consumer protection laws in your state of residence apply.",
      "Disputes will be resolved in the state or federal courts located in Delaware, unless applicable law requires otherwise.",
    ],
  },
] as const;

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: readonly string[];
};

/** Plain-English privacy policy sections (Phase §3.4). Lawyer review pending. */
export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    id: "collect",
    title: "What we collect",
    paragraphs: [
      "Phone numbers you enter for screening, answers to qualification questions, account email and profile fields when you sign in, payment metadata from Stripe (we do not store full card numbers), technical logs (IP address, browser type, timestamps), and optional marketing email if you join the waitlist.",
      "Anonymous visitors receive a random session identifier in an HTTP-only cookie (`rb_anonymous_sid`) so we can rate-limit abuse and attach draft claims before you create an account.",
    ],
  },
  {
    id: "why",
    title: "Why we collect it",
    paragraphs: [
      "To run TCPA-style screening, estimate informational claim strength, generate demand-letter drafts you request, prevent fraud and abuse, comply with law, and improve the product.",
      "We use your email for magic-link sign-in and, if you opt in, occasional product updates about new violation types or states.",
    ],
  },
  {
    id: "retention",
    title: "How long we keep it",
    paragraphs: [
      "Draft claims and screening data are kept while your account is active or as needed to provide the service. You may request deletion (see CCPA below). Backups may retain data for a limited period after deletion.",
      "Waitlist emails are stored until you unsubscribe or ask us to remove them.",
    ],
  },
  {
    id: "third-parties",
    title: "Third parties",
    paragraphs: [
      "Supabase hosts our database and authentication. Stripe processes payments. An AI vendor (e.g. OpenRouter or equivalent) may process text you submit for letter generation under our instructions. Phone/reputation vendors may be used for screening as features ship.",
      "These providers process data only to deliver the service. We do not sell your personal information to data brokers or advertisers.",
    ],
  },
  {
    id: "no-sale",
    title: "We do not sell your data",
    paragraphs: [
      "RingBounty does not sell personal information as defined under the California Consumer Privacy Act (CCPA). We do not share contact details with third parties for their own marketing without your opt-in consent.",
    ],
  },
  {
    id: "ccpa",
    title: "California privacy rights (CCPA)",
    paragraphs: [
      "If you are a California resident, you may request access to, correction of, or deletion of personal information we hold about you, and ask us to export a copy in a portable format.",
      "Submit requests by email to privacy@ringbounty.com with the subject line “CCPA request” and enough detail for us to verify your account or session. We will respond within the timelines required by law. Authorized agents may submit requests with proof of authorization.",
    ],
  },
  {
    id: "lifecycle",
    title: "Anonymous vs signed-in data",
    paragraphs: [
      "Before you sign in, draft claims are linked to your anonymous session cookie and created using server-side APIs — not directly writable from the browser database client.",
      "When you sign in with a magic link, we merge your anonymous draft into your account when possible, then clear the anonymous cookie. If you already have an active draft claim, we may abandon the anonymous draft to avoid duplicates.",
      "After merge, the claim is tied to your user id and protected by row-level security so only you (and our service role for operational tasks) can access it.",
    ],
  },
] as const;

import type { LucideIcon } from "lucide-react";
import { FileCheck, Filter, Scale, Wallet } from "lucide-react";

/** Public firm marketing surface (`/firms`) — portal sign-in deferred. */
export const FIRMS_LANDING_HERO = {
  title: "TCPA leads with evidence, not cold lists",
  subtitle:
    "RingBounty connects participating law firms with consumers who completed an informational screening flow and opted to share structured claim data — including spam signals, qualification answers, and an evidence summary.",
} as const;

export const FIRMS_LANDING_COMING_SOON =
  "Firm portal sign-in is not open yet. We are onboarding a small set of practices first — use the contact path below if you want early access.";

export type FirmsLandingValueProp = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const FIRMS_LANDING_VALUE_PROPS: readonly FirmsLandingValueProp[] = [
  {
    id: "pre-qualified",
    title: "Pre-screened consumer interest",
    description:
      "Leads come from users who ran a number check, completed qualification, and chose to connect with an attorney. You see claim-strength signals and valuation bands — informational only, not a guarantee of recovery.",
    icon: Scale,
  },
  {
    id: "evidence",
    title: "Structured evidence package",
    description:
      "Each referral can include a compiled PDF: spam/DNC summaries, company identification, registered-agent lookup when available, and qualification facts the consumer attested to.",
    icon: FileCheck,
  },
  {
    id: "filters",
    title: "Filter by state, strength, and value",
    description:
      "Review leads that match your criteria before you accept. Decline what does not fit your practice without affecting other firms in the pool.",
    icon: Filter,
  },
  {
    id: "pay-on-accept",
    title: "Pay when you accept",
    description:
      "The platform is built around accepting a lead you want to pursue — not paying for raw contact data upfront. Pricing and onboarding details are shared during firm onboarding.",
    icon: Wallet,
  },
] as const;

export const FIRMS_LANDING_STEPS = [
  {
    title: "Consumer screens and qualifies",
    body: "A user checks a spammer number, answers structured TCPA-style questions, and sees informational strength on their results page.",
  },
  {
    title: "They opt in to attorney connection",
    body: "Eligible users consent to share claim data with participating firms. RingBounty records the referral and prepares the evidence package.",
  },
  {
    title: "Your firm reviews and accepts",
    body: "Matching leads appear in the firm workflow. You accept leads you want to pursue; consumers can see status updates after assignment.",
  },
] as const;

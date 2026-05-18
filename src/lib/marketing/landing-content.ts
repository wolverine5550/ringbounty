import type { LucideIcon } from "lucide-react";
import { Handshake, PhoneCall, Scale } from "lucide-react";

/** Informational stats for the landing trust band (no customer logos / testimonials). */
export const LANDING_STATS = [
  {
    id: "statutory",
    label: "Typical statutory range (informational)",
    value: "$500–$1,500",
    detail: "Per qualifying TCPA violation when facts fit — not a guarantee.",
    percent: 85,
  },
  {
    id: "free-check",
    label: "Initial number screening",
    value: "Free",
    detail: "Start without an account or payment.",
    percent: 100,
  },
  {
    id: "attorney",
    label: "Attorney connection",
    value: "Free opt-in",
    detail: "Eligible users may connect with participating firms — no consumer fee in v0.1.",
    percent: 70,
  },
] as const;

export type LandingFeature = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const LANDING_FEATURES: readonly LandingFeature[] = [
  {
    id: "check",
    title: "Screen spam numbers",
    description:
      "Enter a U.S. phone number and run informational TCPA-style screening. See whether a call may be worth exploring before you commit time.",
    icon: PhoneCall,
  },
  {
    id: "qualify",
    title: "Organize your facts",
    description:
      "Answer structured questions about the calls. We surface educational claim-strength signals and statutory ranges — not predictions about what you will recover.",
    icon: Scale,
  },
  {
    id: "attorney",
    title: "Connect with an attorney",
    description:
      "When your facts look eligible, opt in to share a structured summary with participating law firms. RingBounty does not represent you or charge a referral fee to consumers.",
    icon: Handshake,
  },
] as const;

/** Infrastructure partners shown on the landing page (not customer endorsements). */
export const LANDING_INTEGRATIONS = [
  { id: "supabase", name: "Supabase" },
  { id: "stripe", name: "Stripe" },
  { id: "nextjs", name: "Next.js" },
] as const;

export const LANDING_TRUST_BADGES = [
  "Not a law firm",
  "No contingency fees to consumers",
  "Estimates ≠ guarantees",
] as const;

export const LANDING_PROBLEM_POINTS = [
  "Unwanted robocalls and texts waste your time and may violate federal rules when autodialers or prerecorded messages are involved.",
  "Statutory damages exist under the TCPA for many violations — but whether your specific calls qualify depends on consent, exemptions, and evidence.",
  "Understanding your options takes time; many consumers want organized facts before deciding whether to contact a lawyer.",
] as const;

export const LANDING_SOLUTION_POINTS = [
  "RingBounty helps you screen numbers, structure facts, and see informational claim strength — without promising any outcome.",
  "When you are ready, you may opt in to a free attorney connection so participating firms can review your summary.",
] as const;

/** Homepage anchor ids (header nav scroll targets). */
export const LANDING_HOW_IT_WORKS_SECTION_ID = "how-it-works";
export const LANDING_FAQ_SECTION_ID = "faq";

/** Product flow steps for homepage “How it works” section. */
export const LANDING_FLOW_STEPS = [
  {
    title: "Check",
    body: "Enter a phone number. We run informational screening so you can see whether TCPA may be worth exploring — without creating an account first.",
  },
  {
    title: "Qualify",
    body: "Answer factual questions about the calls. Your answers feed educational strength signals and evidence summaries — not legal advice.",
  },
  {
    title: "Results",
    body: "See informational claim strength and statutory estimate bands on your results page. These are educational only, not guarantees.",
  },
  {
    title: "Connect",
    body: "If eligible, opt in to share your claim summary with participating attorneys. Firms decide whether to contact you; we do not promise representation.",
  },
] as const;

/** Risk-reducer lines beside primary CTAs (wireframe “above button” copy). */
export const LANDING_RISK_REDUCERS = [
  "No account required to start a check",
  "No payment to screen numbers or opt into attorney connection",
  "General information — not legal advice",
] as const;

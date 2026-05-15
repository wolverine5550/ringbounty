import type { LucideIcon } from "lucide-react";
import { FileText, PhoneCall, Scale } from "lucide-react";

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
    id: "diy",
    label: "Self-serve letter path",
    value: "5 steps",
    detail: "Check → qualify → pay → letter → file yourself.",
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
      "Enter a U.S. phone number and run informational TCPA-style screening. See whether a call may be worth exploring before you commit time or money.",
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
    id: "letter",
    title: "Generate a DIY demand letter",
    description:
      "Purchase a template letter built from your inputs. You choose the demand scenario; you send and track correspondence — we do not represent you.",
    icon: FileText,
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
  "No contingency fees",
  "Estimates ≠ guarantees",
] as const;

export const LANDING_PROBLEM_POINTS = [
  "Unwanted robocalls and texts waste your time and may violate federal rules when autodialers or prerecorded messages are involved.",
  "Statutory damages exist under the TCPA for many violations — but whether your specific calls qualify depends on consent, exemptions, and evidence.",
  "Hiring counsel is not always necessary for a first demand letter, yet the law is fact-specific and outcomes vary.",
] as const;

export const LANDING_SOLUTION_POINTS = [
  "RingBounty helps you screen numbers, structure facts, and prepare a DIY demand letter from general legal background — without promising any outcome.",
  "You stay in control: we provide information and document tooling; you decide whether and how to pursue a claim.",
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
    body: "Answer factual questions about the calls. We estimate claim strength and statutory ranges from your inputs. Estimates are educational, not promises.",
  },
  {
    title: "Pay",
    body: "Purchase a DIY demand letter when you are ready. Pricing is shown before you pay.",
  },
  {
    title: "Letter",
    body: "We generate a template letter from the facts you provide. You choose a demand scenario; we do not recommend which amount to request.",
  },
  {
    title: "File",
    body: "You send and track the letter yourself. RingBounty explains the general process; we do not file on your behalf.",
  },
] as const;

/** Risk-reducer lines beside primary CTAs (wireframe “above button” copy). */
export const LANDING_RISK_REDUCERS = [
  "No account required to start a check",
  "Pay only if you choose to buy a letter",
  "General information — not legal advice",
] as const;

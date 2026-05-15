import { FAQ_NON_ADVICE_REMINDER } from "./non-advice-reminder";

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
};

/** Objection-handling FAQ copy (Phase §3.3.1). */
export const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    id: "cost",
    question: "How much does RingBounty cost?",
    answer: `Checking a number is free during the MVP. If you choose to purchase a DIY demand letter later, you pay a fixed product fee at checkout (pricing is shown before you pay). We do not charge contingency fees or take a percentage of any recovery you might obtain on your own.${FAQ_NON_ADVICE_REMINDER}`,
  },
  {
    id: "legality",
    question: "Is using RingBounty legal?",
    answer: `RingBounty provides informational tools and document templates so you can organize facts and explore TCPA-related issues. Many consumers send their own demand letters, but whether a particular approach is appropriate depends on your facts and jurisdiction. We are not a law firm and do not represent you.${FAQ_NON_ADVICE_REMINDER}`,
  },
  {
    id: "will-i-win",
    question: "Will I win or get paid?",
    answer: `We cannot predict outcomes. Statutory damage amounts shown in the product are educational estimates based on published ranges — not guarantees of payment, settlement, or success in court. Whether a call violated the TCPA, whether damages apply, and whether a company pays all depend on the evidence and law.${FAQ_NON_ADVICE_REMINDER}`,
  },
  {
    id: "time-to-pay",
    question: "When do I pay?",
    answer: `You can run an initial number check without paying or creating an account. Payment is only required when you decide to buy a generated demand letter (a later step in the flow). You are never asked to pay to see basic screening results.${FAQ_NON_ADVICE_REMINDER}`,
  },
  {
    id: "dnc",
    question: "What about the Do Not Call Registry?",
    answer: `The National Do Not Call Registry is one factor courts may consider in TCPA cases, but registration alone does not automatically mean every call is unlawful. Exemptions, prior consent, and call type matter. RingBounty may surface registry-related signals as part of informational screening; results are not a final legal determination.${FAQ_NON_ADVICE_REMINDER}`,
  },
  {
    id: "attorney",
    question: "Do I need a lawyer?",
    answer: `You may use RingBounty without hiring counsel for the DIY letter path. Complex cases, class actions, or disputes with large companies may benefit from a licensed attorney. We do not provide legal representation, negotiate on your behalf, or file lawsuits for you.${FAQ_NON_ADVICE_REMINDER}`,
  },
] as const;

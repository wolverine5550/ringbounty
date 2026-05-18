import { FAQ_NON_ADVICE_REMINDER } from "./non-advice-reminder";

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
};

/** Objection-handling FAQ copy (Phase §3.3.1, updated §3.7). */
export const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    id: "cost",
    question: "How much does RingBounty cost?",
    answer: `Checking a number is free. Qualification, informational claim-strength results, and opting in to connect with a participating attorney are also free for consumers in the current product — we do not charge you a fee to use the screening flow or to request an attorney connection. Participating law firms operate under their own arrangements if you retain them.${FAQ_NON_ADVICE_REMINDER}`,
  },
  {
    id: "legality",
    question: "Is using RingBounty legal?",
    answer: `RingBounty provides informational tools so you can organize facts and explore whether TCPA-related issues may be worth discussing with a lawyer. We are not a law firm and do not represent you. Whether any particular call violated the law depends on your facts and jurisdiction.${FAQ_NON_ADVICE_REMINDER}`,
  },
  {
    id: "will-i-win",
    question: "Will I win or get paid?",
    answer: `We cannot predict outcomes. Statutory amount ranges shown in the product are educational estimates based on published ranges — not guarantees of payment, settlement, or success in court. Whether a call violated the TCPA, whether damages apply, and whether a company pays all depend on the evidence and law.${FAQ_NON_ADVICE_REMINDER}`,
  },
  {
    id: "time-to-pay",
    question: "When do I pay?",
    answer: `You can run an initial number check without paying or creating an account. The consumer-facing product does not require payment to see screening results, complete qualification, or opt in to an attorney connection. You are never asked to pay to see basic screening results.${FAQ_NON_ADVICE_REMINDER}`,
  },
  {
    id: "dnc",
    question: "What about the Do Not Call Registry?",
    answer: `The National Do Not Call Registry is one factor courts may consider in TCPA cases, but registration alone does not automatically mean every call is unlawful. Exemptions, prior consent, and call type matter. RingBounty may surface registry-related signals as part of informational screening; results are not a final legal determination.${FAQ_NON_ADVICE_REMINDER}`,
  },
  {
    id: "attorney",
    question: "Do I need a lawyer?",
    answer: `You may explore RingBounty without hiring counsel. If your screening looks eligible, you can opt in to share a structured summary with participating law firms — free to you. Firms decide whether to contact you; we do not guarantee that any attorney will take your case. Complex disputes may still benefit from advice from a licensed attorney in your state.${FAQ_NON_ADVICE_REMINDER}`,
  },
] as const;

/**
 * Inserts the user-provided company name into consent prompts (step 5).
 */

const FALLBACK_COMPANY_LABEL = "the company you identified";

/** Replaces `{{company}}` in qualify consent copy. */
export function formatCompanyConsentPrompt(
  template: string,
  companyName: string | null | undefined,
): string {
  const label = companyName?.trim() || FALLBACK_COMPANY_LABEL;
  return template.replaceAll("{{company}}", label);
}

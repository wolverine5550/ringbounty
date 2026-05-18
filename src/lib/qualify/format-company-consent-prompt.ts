/**
 * Inserts the user-provided company name into consent prompts (step 5).
 */

import { isSubstantiveCompanyName } from "@/lib/constants/company-identification";

/** Used when the caller is unidentified or the user entered a placeholder. */
export const CONSENT_GENERIC_COMPANY_LABEL = "the company";

/**
 * True when the user identified a real company (step 5 consent applies).
 */
export function isNamedCompanyForConsent(
  companyName: string | null | undefined,
): boolean {
  return isSubstantiveCompanyName(companyName);
}

/**
 * Resolves a display label for consent copy — never returns raw "UNKNOWN".
 */
export function resolveCompanyConsentLabel(
  companyName: string | null | undefined,
): string {
  if (!isNamedCompanyForConsent(companyName)) {
    return CONSENT_GENERIC_COMPANY_LABEL;
  }
  return companyName!.trim();
}

/** Replaces `{{company}}` in qualify consent copy. */
export function formatCompanyConsentPrompt(
  template: string,
  companyName: string | null | undefined,
): string {
  const label = resolveCompanyConsentLabel(companyName);
  return template.replaceAll("{{company}}", label);
}

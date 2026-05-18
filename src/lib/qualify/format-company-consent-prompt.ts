/**
 * Inserts the user-provided company name into consent prompts (step 5).
 */

/** Used when the caller is unidentified or the user entered a placeholder. */
export const CONSENT_GENERIC_COMPANY_LABEL = "the company";

const PLACEHOLDER_COMPANY_NAMES = new Set([
  "unknown",
  "n/a",
  "na",
  "not sure",
  "unsure",
  "none",
]);

/**
 * True when the user identified a real company (step 5 consent applies).
 */
export function isNamedCompanyForConsent(
  companyName: string | null | undefined,
): boolean {
  const trimmed = companyName?.trim() ?? "";
  if (trimmed.length < 2) {
    return false;
  }
  return !PLACEHOLDER_COMPANY_NAMES.has(trimmed.toLowerCase());
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

/**
 * Phase 6.1.3 / 6.2 — No automated National Registry lookup (FTC permitted-use).
 *
 * Shown on `/check`; qualification uses manual attestation (see federal-dnc-attestation.ts).
 */

import { DONOTCALL_GOV_URL } from "@/lib/constants/federal-dnc-attestation";

/** User-facing copy when automated federal DNC lookup is not offered. */
export const FEDERAL_DNC_UNAVAILABLE_USER_MESSAGE =
  `We do not access the National Do Not Call Registry for you. Before you continue, you will confirm whether your number is registered (you can verify at ${DONOTCALL_GOV_URL} — your FTC confirmation email includes your registration date). We will not assume registry status for scoring until you attest.`;

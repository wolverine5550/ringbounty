/**
 * CI-6.1 — Callback recursive lookup policy (cost cap + dedupe helpers).
 */

import { normalizeUsPhoneToE164 } from "@/lib/check/us-phone";

/** CI-6.1.4 — Max callback numbers enqueued per parent run. */
export const MAX_CALLBACK_RECURSIVE_LOOKUPS = 2;

export type PickCallbacksParams = {
  callbackNumbers: string[];
  parentPhoneNormalized: string;
  maxCount?: number;
};

/**
 * Normalizes and dedupes callback E.164s, drops the parent subject phone, caps count.
 */
export function pickCallbackNumbersForRecursiveLookup(
  params: PickCallbacksParams,
): string[] {
  const max = params.maxCount ?? MAX_CALLBACK_RECURSIVE_LOOKUPS;
  const parent = normalizeUsPhoneToE164(params.parentPhoneNormalized);
  const out: string[] = [];

  for (const raw of params.callbackNumbers) {
    const e164 = normalizeUsPhoneToE164(raw);
    if (!e164) {
      continue;
    }
    if (parent && e164 === parent) {
      continue;
    }
    if (out.includes(e164)) {
      continue;
    }
    out.push(e164);
    if (out.length >= max) {
      break;
    }
  }

  return out;
}

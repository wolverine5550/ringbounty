/**
 * US NANP helpers for `/check` step 1 (task_manager §4.3–4.4).
 * Display uses a simple (XXX) XXX-XXXX mask; canonical storage uses E.164 (`+1…`).
 */

/** Area code and exchange first digits must be 2–9 (ITU NANP). */
const NANP_TEN_DIGIT_PATTERN = /^[2-9]\d{2}[2-9]\d{6}$/;

/** Strip non-digits (for masks pasted with spaces/parens). */
export function extractUsPhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Returns a stable 10-digit key when the input has exactly 10 national digits
 * (or 11 with a leading country code 1). Does **not** validate NANP numbering rules;
 * use {@link normalizeUsPhoneToE164} for full validation.
 */
export function normalizeNanp10Key(raw: string): string | null {
  let d = extractUsPhoneDigits(raw);
  if (d.length === 11 && d.startsWith("1")) {
    d = d.slice(1);
  }
  if (d.length !== 10) {
    return null;
  }
  return d;
}

/**
 * Normalizes a US/NANP phone string to E.164 (`+1` + 10 digits) or `null` if
 * the number is incomplete, too long, or fails basic NANP structure (area/exchange rules).
 */
export function normalizeUsPhoneToE164(input: string): string | null {
  const ten = normalizeNanp10Key(input);
  if (ten === null || !NANP_TEN_DIGIT_PATTERN.test(ten)) {
    return null;
  }
  return `+1${ten}`;
}

/**
 * Formats up to 10 NANP digits as `(555) 123-4567` for controlled inputs.
 * Passing more than 10 digits is ignored (caller should cap before calling).
 */
export function formatUsPhoneMask(digitsOnly: string): string {
  const d = extractUsPhoneDigits(digitsOnly).slice(0, 10);
  if (d.length === 0) {
    return "";
  }
  if (d.length <= 3) {
    return `(${d}`;
  }
  if (d.length <= 6) {
    return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  }
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** One validated row ready for persistence (`phone_number_normalized` + optional masked display). */
export type DedupedPhoneEntry = {
  phoneNumberNormalized: string;
  phoneNumberDisplay: string | null;
};

/**
 * Validates each entry with {@link normalizeUsPhoneToE164}, optional parallel display strings,
 * and dedupes by E.164.
 */
export function parseAndDedupePhoneNumberPayload(
  rawList: unknown,
  maxRows: number,
  displayInputs?: unknown,
):
  | { ok: true; entries: DedupedPhoneEntry[] }
  | {
      ok: false;
      error:
        | "invalid_body"
        | "too_many"
        | "invalid_entry"
        | "duplicates"
        | "display_length_mismatch"
        | "invalid_display_entry";
    } {
  if (!Array.isArray(rawList)) {
    return { ok: false, error: "invalid_body" };
  }
  if (rawList.length > maxRows) {
    return { ok: false, error: "too_many" };
  }

  let displays: Array<string | null> | undefined;
  if (displayInputs !== undefined) {
    if (!Array.isArray(displayInputs)) {
      return { ok: false, error: "invalid_body" };
    }
    if (displayInputs.length !== rawList.length) {
      return { ok: false, error: "display_length_mismatch" };
    }
    displays = [];
    for (const d of displayInputs) {
      if (d === null) {
        displays.push(null);
        continue;
      }
      if (typeof d !== "string") {
        return { ok: false, error: "invalid_display_entry" };
      }
      const trimmed = d.trim();
      displays.push(trimmed.length > 0 ? trimmed : null);
    }
  }

  const entries: DedupedPhoneEntry[] = [];
  const keys: string[] = [];
  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (typeof item !== "string") {
      return { ok: false, error: "invalid_entry" };
    }
    const e164 = normalizeUsPhoneToE164(item);
    if (e164 === null) {
      return { ok: false, error: "invalid_entry" };
    }
    keys.push(e164);
    const display = displays?.[i] ?? null;
    entries.push({
      phoneNumberNormalized: e164,
      phoneNumberDisplay: display,
    });
  }
  const unique = new Set(keys);
  if (unique.size !== keys.length) {
    return { ok: false, error: "duplicates" };
  }
  return { ok: true, entries };
}

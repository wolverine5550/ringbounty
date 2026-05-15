/**
 * US NANP helpers for `/check` step 1 (task_manager §4.3–4.4 bridge).
 * Display uses a simple (XXX) XXX-XXXX mask; API payloads use digits-only strings.
 */

/** Strip non-digits (for masks pasted with spaces/parens). */
export function extractUsPhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Returns a stable 10-digit key for duplicate detection when input is a full NANP number.
 * Accepts 10 national digits or 11 digits with leading country code 1.
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

/**
 * Server-side: normalize each submitted string to a 10-digit key; detect duplicates and excess length.
 * @returns deduped list or an error code for HTTP handling.
 */
export function parseAndDedupePhoneNumberPayload(
  rawList: unknown,
  maxRows: number,
):
  | { ok: true; normalized: string[] }
  | { ok: false; error: "invalid_body" | "too_many" | "invalid_entry" | "duplicates" } {
  if (!Array.isArray(rawList)) {
    return { ok: false, error: "invalid_body" };
  }
  if (rawList.length > maxRows) {
    return { ok: false, error: "too_many" };
  }
  const keys: string[] = [];
  for (const item of rawList) {
    if (typeof item !== "string") {
      return { ok: false, error: "invalid_entry" };
    }
    const key = normalizeNanp10Key(item);
    if (key === null) {
      return { ok: false, error: "invalid_entry" };
    }
    keys.push(key);
  }
  const unique = new Set(keys);
  if (unique.size !== keys.length) {
    return { ok: false, error: "duplicates" };
  }
  return { ok: true, normalized: keys };
}

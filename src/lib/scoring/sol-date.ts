/**
 * Phase 8.2 — UTC date-only parsing for statute-of-limitations comparisons.
 */

/**
 * Parses `YYYY-MM-DD` (or ISO date prefix) to UTC midnight for stable day math.
 */
export function toUtcDateOnly(value: string | Date): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (!match) {
    return null;
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

/** Subtract whole calendar years from a UTC date-only value. */
export function subtractUtcYears(from: Date, years: number): Date {
  const result = new Date(from.getTime());
  result.setUTCFullYear(result.getUTCFullYear() - years);
  return result;
}

/**
 * Phase 6.2 — Federal DNC eligibility from user-attested dates (PRD §7 Step 4).
 *
 * PRD: eligible when registered AND registration_date is at least 31 full days before
 * the earliest relevant call date.
 */

/** Calendar days the FTC cites before telemarketers must stop calling (PRD / TSR). */
export const FEDERAL_DNC_MIN_DAYS_BEFORE_CALL = 31;

/**
 * Parses `YYYY-MM-DD` (or ISO date prefix) to UTC midnight for stable day math.
 */
function toUtcDateOnly(value: string | Date): Date | null {
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

/**
 * True when `registrationDate` is on or before `earliestCallDate` minus 31 days.
 * Returns false if either date is invalid.
 */
export function computeFederalDncEligibleFromDates(
  registrationDate: string | Date,
  earliestCallDate: string | Date,
): boolean {
  const reg = toUtcDateOnly(registrationDate);
  const earliest = toUtcDateOnly(earliestCallDate);
  if (!reg || !earliest) {
    return false;
  }
  const deadlineMs =
    earliest.getTime() -
    FEDERAL_DNC_MIN_DAYS_BEFORE_CALL * 24 * 60 * 60 * 1000;
  return reg.getTime() <= deadlineMs;
}

/**
 * CI-2.1.2 — Aggregate FTC complaint rows per phone (Path B).
 * Modal `Subject` when multiple categories; sum counts across daily files.
 */

import { confidenceLevelForFtcComplaintCount } from "./ftc-confidence-bucket";
import type {
  FtcDncComplaintRow,
  FtcPhoneAggregate,
  SeedViolationUpsertRow,
} from "./types";

type MutableAggregate = {
  phoneNumberNormalized: string;
  subjectCounts: Map<string, number>;
  robocallYes: number;
  robocallNo: number;
  violationCount: number;
  lastViolationAt: string | null;
  sourceFileDates: Set<string>;
};

function pickModalSubject(counts: Map<string, number>): string {
  let best = "No Subject Provided";
  let bestCount = 0;
  for (const [subject, count] of counts) {
    if (count > bestCount) {
      best = subject;
      bestCount = count;
    }
  }
  return best;
}

function maxViolationAt(a: string | null, b: string | null): string | null {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return a >= b ? a : b;
}

function upsertMutable(
  map: Map<string, MutableAggregate>,
  row: FtcDncComplaintRow,
): void {
  let agg = map.get(row.phoneNumberNormalized);
  if (!agg) {
    agg = {
      phoneNumberNormalized: row.phoneNumberNormalized,
      subjectCounts: new Map(),
      robocallYes: 0,
      robocallNo: 0,
      violationCount: 0,
      lastViolationAt: null,
      sourceFileDates: new Set(),
    };
    map.set(row.phoneNumberNormalized, agg);
  }

  agg.violationCount += 1;
  agg.subjectCounts.set(
    row.ftcSubject,
    (agg.subjectCounts.get(row.ftcSubject) ?? 0) + 1,
  );
  if (row.isRobocall === true) {
    agg.robocallYes += 1;
  } else if (row.isRobocall === false) {
    agg.robocallNo += 1;
  }
  agg.lastViolationAt = maxViolationAt(agg.lastViolationAt, row.violationAt);
  agg.sourceFileDates.add(row.sourceFileDate);
}

/** Aggregate parsed rows into per-phone summaries. */
export function aggregateFtcDncComplaints(
  rows: FtcDncComplaintRow[],
): FtcPhoneAggregate[] {
  const map = new Map<string, MutableAggregate>();
  for (const row of rows) {
    upsertMutable(map, row);
  }

  return [...map.values()].map((agg) => ({
    phoneNumberNormalized: agg.phoneNumberNormalized,
    violationCount: agg.violationCount,
    modalFtcSubject: pickModalSubject(agg.subjectCounts),
    robocallMajority: agg.robocallYes >= agg.robocallNo,
    lastViolationAt: agg.lastViolationAt,
    sourceFileDates: [...agg.sourceFileDates].sort(),
  }));
}

/** Map aggregates to `seed_violations` upsert rows (Path B — `reported_company_name` null). */
export function aggregatesToSeedViolationRows(
  aggregates: FtcPhoneAggregate[],
  refreshedAt: Date = new Date(),
): SeedViolationUpsertRow[] {
  const iso = refreshedAt.toISOString();
  return aggregates.map((agg) => ({
    phone_number_normalized: agg.phoneNumberNormalized,
    reported_company_name: null,
    confidence_level: confidenceLevelForFtcComplaintCount(agg.violationCount),
    violation_count: agg.violationCount,
    source: "ftc_complaint" as const,
    litigation_status: null,
    last_refreshed_at: iso,
    metadata: {
      ftc_subject: agg.modalFtcSubject,
      complaint_count: agg.violationCount,
      robocall_majority: agg.robocallMajority,
      last_violation_at: agg.lastViolationAt,
      source_file_dates: agg.sourceFileDates,
    },
  }));
}

/**
 * CI-2.1 — FTC DNC bulk ETL types (Path B: phone + category + count; no legal name).
 */

/** One parsed FTC daily CSV row after phone normalization (consumer PII dropped). */
export type FtcDncComplaintRow = {
  phoneNumberNormalized: string;
  /** FTC `Subject` — complaint category label, not legal entity name. */
  ftcSubject: string;
  /** `Recorded_Message_Or_Robocall` when Y/N; null when empty. */
  isRobocall: boolean | null;
  /** ISO-ish datetime from `Violation_Date` when parseable. */
  violationAt: string | null;
  /** `YYYY-MM-DD` from ingest filename or CLI `--date`. */
  sourceFileDate: string;
};

/** Aggregated per-phone stats across one or more daily CSV files. */
export type FtcPhoneAggregate = {
  phoneNumberNormalized: string;
  violationCount: number;
  modalFtcSubject: string;
  robocallMajority: boolean;
  lastViolationAt: string | null;
  sourceFileDates: string[];
};

/** Row shape for `seed_violations` upsert (Path B). */
export type SeedViolationUpsertRow = {
  phone_number_normalized: string;
  reported_company_name: null;
  confidence_level: string;
  violation_count: number;
  source: "ftc_complaint";
  litigation_status: null;
  last_refreshed_at: string;
  metadata: {
    ftc_subject: string;
    complaint_count: number;
    robocall_majority: boolean;
    last_violation_at: string | null;
    source_file_dates: string[];
  };
};

export type FtcCsvParseStats = {
  dataRows: number;
  skippedEmptyPhone: number;
  skippedInvalidPhone: number;
};

/**
 * CI-2.1.1–2 — Parse FTC daily DNC complaint CSV (Path B).
 * Drops complainant PII columns; never logs phone numbers or consumer fields.
 */

import { normalizeUsPhoneToE164 } from "@/lib/check/us-phone";

import type { FtcCsvParseStats, FtcDncComplaintRow } from "./types";

const EXPECTED_HEADER = [
  "Company_Phone_Number",
  "Created_Date",
  "Violation_Date",
  "Consumer_City",
  "Consumer_State",
  "Consumer_Area_Code",
  "Subject",
  "Recorded_Message_Or_Robocall",
] as const;

/** Public FTC daily file URL pattern (CI-P.2.1). */
export function ftcDailyCsvUrl(sourceFileDate: string): string {
  return `https://www.ftc.gov/sites/default/files/DNC_Complaint_Numbers_${sourceFileDate}.csv`;
}

/**
 * RFC-style single-line CSV parse (handles quoted fields with commas).
 */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      fields.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  fields.push(current);
  return fields;
}

function parseRobocallFlag(raw: string): boolean | null {
  const v = raw.trim().toUpperCase();
  if (v === "Y") {
    return true;
  }
  if (v === "N") {
    return false;
  }
  return null;
}

function normalizeViolationAt(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertHeader(columns: string[]): void {
  const normalized = columns.map((c) => c.trim());
  const ok =
    normalized.length >= EXPECTED_HEADER.length &&
    EXPECTED_HEADER.every((name, idx) => normalized[idx] === name);
  if (!ok) {
    throw new Error(
      `Unexpected FTC CSV header; expected ${EXPECTED_HEADER.join(",")}`,
    );
  }
}

/**
 * Parse full CSV text into normalized rows. `sourceFileDate` is `YYYY-MM-DD`.
 */
export function parseFtcDncCsv(
  csvText: string,
  sourceFileDate: string,
): { rows: FtcDncComplaintRow[]; stats: FtcCsvParseStats } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return {
      rows: [],
      stats: {
        dataRows: 0,
        skippedEmptyPhone: 0,
        skippedInvalidPhone: 0,
      },
    };
  }

  const headerCols = parseCsvLine(lines[0]!);
  assertHeader(headerCols);

  const rows: FtcDncComplaintRow[] = [];
  let skippedEmptyPhone = 0;
  let skippedInvalidPhone = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]!);
    const phoneRaw = cols[0]?.trim() ?? "";
    if (!phoneRaw) {
      skippedEmptyPhone += 1;
      continue;
    }

    const e164 = normalizeUsPhoneToE164(phoneRaw);
    if (!e164) {
      skippedInvalidPhone += 1;
      continue;
    }

    const subject = (cols[6] ?? "").trim() || "No Subject Provided";
    const robocallRaw = cols[7] ?? "";

    rows.push({
      phoneNumberNormalized: e164,
      ftcSubject: subject,
      isRobocall: parseRobocallFlag(robocallRaw),
      violationAt: normalizeViolationAt(cols[2] ?? ""),
      sourceFileDate,
    });
  }

  return {
    rows,
    stats: {
      dataRows: lines.length - 1,
      skippedEmptyPhone,
      skippedInvalidPhone,
    },
  };
}

/** Download one FTC daily CSV (no PII in logs). */
export async function downloadFtcDailyCsv(
  sourceFileDate: string,
): Promise<string> {
  const url = ftcDailyCsvUrl(sourceFileDate);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `FTC CSV download failed (${res.status}) for date ${sourceFileDate}`,
    );
  }
  return res.text();
}

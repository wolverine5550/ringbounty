#!/usr/bin/env npx tsx
/**
 * CI-2.1 — FTC DNC daily CSV → `seed_violations` (Path B).
 *
 * LEGAL / DATA USE (CI-2.1.4 — counsel review **CI-P.2.4** before prod ingest):
 * - Source: FTC open-government DNC complaint daily files
 *   (https://www.ftc.gov/site-information/open-government/data-sets/do-not-call-data).
 * - Path B: no legal entity name in bulk CSV — store phone + modal FTC category + counts only.
 * - Do NOT ingest or log complainant PII (`Consumer_*` columns).
 * - Do NOT log full phone numbers in stdout (counts + dates only).
 * - Complaints are unverified consumer reports — do not imply confirmed defendant identity in product copy.
 * - Recommend 30–90 day rolling window; re-run with full window files each refresh (replaces rows per phone).
 * - Ship to production only after counsel sign-off on display of aggregated count + category.
 *
 * Usage:
 *   npx tsx scripts/etl/ftc-dnc-complaints-ingest.ts --date 2026-05-15
 *   npx tsx scripts/etl/ftc-dnc-complaints-ingest.ts --file ./docs/DNC_Complaint_Numbers_2026-05-15.csv
 *   npx tsx scripts/etl/ftc-dnc-complaints-ingest.ts --file a.csv --file b.csv --dry-run
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  aggregateFtcDncComplaints,
  aggregatesToSeedViolationRows,
} from "@/lib/company-intelligence/etl/aggregate-ftc-dnc-complaints";
import {
  downloadFtcDailyCsv,
  parseFtcDncCsv,
} from "@/lib/company-intelligence/etl/parse-ftc-dnc-csv";
import type { FtcDncComplaintRow } from "@/lib/company-intelligence/etl/types";
import { upsertSeedViolationsBatch } from "@/lib/company-intelligence/etl/upsert-seed-violations-batch";
import {
  createAdminClient,
  SupabaseAdminKeyMissingError,
} from "@/lib/supabase/admin";

type CliArgs = {
  dates: string[];
  files: string[];
  dryRun: boolean;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseArgs(argv: string[]): CliArgs {
  const dates: string[] = [];
  const files: string[] = [];
  let dryRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--date") {
      const value = argv[i + 1];
      if (!value || !DATE_RE.test(value)) {
        throw new Error("--date requires YYYY-MM-DD");
      }
      dates.push(value);
      i += 1;
      continue;
    }
    if (arg === "--file") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--file requires a path");
      }
      files.push(value);
      i += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { dates, files, dryRun };
}

function printHelp(): void {
  console.log(`FTC DNC complaints ingest (CI-2.1 Path B)

Options:
  --date YYYY-MM-DD   Download FTC daily CSV for that date
  --file PATH         Local CSV (repeatable)
  --dry-run           Parse + aggregate only; no Supabase upsert
  --help              Show this message
`);
}

function sourceDateFromFilePath(filePath: string): string {
  const base = path.basename(filePath);
  const match = base.match(/DNC_Complaint_Numbers_(\d{4}-\d{2}-\d{2})\.csv/i);
  if (match?.[1]) {
    return match[1];
  }
  throw new Error(
    `Cannot infer source date from filename ${base}; use --date or rename to DNC_Complaint_Numbers_YYYY-MM-DD.csv`,
  );
}

async function loadCsvForDate(date: string): Promise<{
  rows: FtcDncComplaintRow[];
  stats: ReturnType<typeof parseFtcDncCsv>["stats"];
}> {
  const text = await downloadFtcDailyCsv(date);
  const { rows, stats } = parseFtcDncCsv(text, date);
  return { rows, stats };
}

async function loadCsvForFile(filePath: string): Promise<{
  rows: FtcDncComplaintRow[];
  stats: ReturnType<typeof parseFtcDncCsv>["stats"];
}> {
  const absolute = path.resolve(filePath);
  const text = await readFile(absolute, "utf8");
  const sourceFileDate = sourceDateFromFilePath(absolute);
  const { rows, stats } = parseFtcDncCsv(text, sourceFileDate);
  return { rows, stats };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.dates.length === 0 && args.files.length === 0) {
    printHelp();
    throw new Error("Provide at least one --date or --file");
  }

  const allRows: FtcDncComplaintRow[] = [];
  let totalDataRows = 0;
  let skippedEmptyPhone = 0;
  let skippedInvalidPhone = 0;

  for (const date of args.dates) {
    const { rows, stats } = await loadCsvForDate(date);
    allRows.push(...rows);
    totalDataRows += stats.dataRows;
    skippedEmptyPhone += stats.skippedEmptyPhone;
    skippedInvalidPhone += stats.skippedInvalidPhone;
    console.log(
      JSON.stringify({
        event: "ftc_csv_parsed",
        source: "download",
        source_file_date: date,
        parsed_rows: rows.length,
        data_rows: stats.dataRows,
        skipped_empty_phone: stats.skippedEmptyPhone,
        skipped_invalid_phone: stats.skippedInvalidPhone,
      }),
    );
  }

  for (const file of args.files) {
    const { rows, stats } = await loadCsvForFile(file);
    allRows.push(...rows);
    totalDataRows += stats.dataRows;
    skippedEmptyPhone += stats.skippedEmptyPhone;
    skippedInvalidPhone += stats.skippedInvalidPhone;
    console.log(
      JSON.stringify({
        event: "ftc_csv_parsed",
        source: "file",
        file: path.basename(file),
        parsed_rows: rows.length,
        data_rows: stats.dataRows,
        skipped_empty_phone: stats.skippedEmptyPhone,
        skipped_invalid_phone: stats.skippedInvalidPhone,
      }),
    );
  }

  const aggregates = aggregateFtcDncComplaints(allRows);
  const seedRows = aggregatesToSeedViolationRows(aggregates);

  console.log(
    JSON.stringify({
      event: "ftc_aggregate_complete",
      input_rows: allRows.length,
      unique_phones: aggregates.length,
      total_data_rows: totalDataRows,
      skipped_empty_phone: skippedEmptyPhone,
      skipped_invalid_phone: skippedInvalidPhone,
      dry_run: args.dryRun,
    }),
  );

  if (args.dryRun) {
    return;
  }

  try {
    const admin = createAdminClient();
    const result = await upsertSeedViolationsBatch(admin, seedRows);
    console.log(
      JSON.stringify({
        event: "seed_violations_upsert_complete",
        upserted: result.upserted,
        batches: result.batches,
      }),
    );
  } catch (e) {
    if (e instanceof SupabaseAdminKeyMissingError) {
      throw new Error(
        "Supabase admin key missing — set SUPABASE_SECRET_KEY for ingest",
      );
    }
    throw e;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "unknown";
  console.error(JSON.stringify({ event: "ftc_ingest_failed", message }));
  process.exit(1);
});

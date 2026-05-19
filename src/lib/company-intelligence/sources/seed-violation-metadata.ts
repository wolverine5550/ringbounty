/**
 * CI-2 — Parsed `seed_violations.metadata` shapes (FTC Path B + agent write-back).
 */

/** FTC bulk ETL (Path B) — see CI-2.1. */
export type FtcSeedViolationMetadata = {
  ftc_subject?: string;
  complaint_count?: number;
  robocall_majority?: boolean;
  last_violation_at?: string | null;
  source_file_dates?: string[];
};

/** Agent write-back (CI-2.2.3) after substantive name from a later round. */
export type AgentSeedWritebackMetadata = {
  agent_writeback?: boolean;
  synthesized_confidence?: number;
  claim_subject_id?: string;
  run_id?: string;
};

export type SeedViolationMetadata = FtcSeedViolationMetadata &
  AgentSeedWritebackMetadata;

export function parseSeedViolationMetadata(
  raw: unknown,
): SeedViolationMetadata | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  return raw as SeedViolationMetadata;
}

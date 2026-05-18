/**
 * Loads claim summaries for the authenticated consumer dashboard (`/dashboard`).
 */

import { formatUsPhoneMask } from "@/lib/check/us-phone";
import { getResultsStrengthDisplay } from "@/lib/constants/results-strength";
import type { ClaimStrengthGate } from "@/lib/claims/successful-query";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

type ClaimSubjectRow = Pick<
  Database["public"]["Tables"]["claim_subjects"]["Row"],
  "id" | "phone_number" | "phone_number_normalized" | "company_name"
>;

type ClaimRow = Pick<
  Database["public"]["Tables"]["claims"]["Row"],
  "id" | "status" | "claim_strength" | "created_at" | "updated_at"
> & {
  claim_subjects: ClaimSubjectRow[];
};

export type DashboardClaimSummary = {
  claimId: string;
  status: string;
  claimStrength: ClaimStrengthGate | null;
  strengthLabel: string | null;
  createdAt: string;
  updatedAt: string;
  subjectCount: number;
  phoneLabels: string[];
  companyNames: string[];
  resultsHref: string;
  qualifyHref: string | null;
};

export type UserClaimsDashboard = {
  totalChecks: number;
  totalNumbers: number;
  claims: DashboardClaimSummary[];
};

function displayPhone(subject: ClaimSubjectRow): string | null {
  if (subject.phone_number?.trim()) {
    return subject.phone_number.trim();
  }
  const normalized = subject.phone_number_normalized;
  if (!normalized) {
    return null;
  }
  const digits = normalized.replace(/\D/g, "").slice(-10);
  if (digits.length === 10) {
    return formatUsPhoneMask(digits);
  }
  return normalized;
}

function strengthLabel(
  strength: ClaimStrengthGate | null,
): string | null {
  if (!strength) {
    return null;
  }
  return getResultsStrengthDisplay(strength).label;
}

function mapClaim(row: ClaimRow): DashboardClaimSummary | null {
  const subjects = row.claim_subjects ?? [];
  if (subjects.length === 0) {
    return null;
  }

  const phoneLabels = subjects
    .map(displayPhone)
    .filter((value): value is string => Boolean(value));
  const companyNames = subjects
    .map((s) => s.company_name?.trim())
    .filter((value): value is string => Boolean(value));

  const resultsHref = `/results?claim=${row.id}`;
  const qualifyHref =
    row.status === "draft" && subjects[0]?.id
      ? `/qualify/${subjects[0].id}`
      : null;

  return {
    claimId: row.id,
    status: row.status,
    claimStrength: (row.claim_strength as ClaimStrengthGate | null) ?? null,
    strengthLabel: strengthLabel(
      (row.claim_strength as ClaimStrengthGate | null) ?? null,
    ),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    subjectCount: subjects.length,
    phoneLabels,
    companyNames,
    resultsHref,
    qualifyHref,
  };
}

/**
 * Returns dashboard rows for claims that have at least one screened subject.
 */
export async function loadUserClaimsDashboard(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserClaimsDashboard> {
  const { data, error } = await supabase
    .from("claims")
    .select(
      "id, status, claim_strength, created_at, updated_at, claim_subjects ( id, phone_number, phone_number_normalized, company_name )",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const claims = (data ?? [])
    .map((row) => mapClaim(row as ClaimRow))
    .filter((row): row is DashboardClaimSummary => row !== null);

  const totalNumbers = claims.reduce(
    (sum, claim) => sum + claim.subjectCount,
    0,
  );

  return {
    totalChecks: claims.length,
    totalNumbers,
    claims,
  };
}

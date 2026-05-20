import type { QualifyCompanyIntelSnapshot } from "@/lib/qualify/load-qualify-company-intel";

/** CI-8.5 — Mocked Lane B completion with a substantive Q13 suggestion. */
export const MOCK_COMPANY_INTEL_SUGGESTION: QualifyCompanyIntelSnapshot = {
  status: "completed",
  company_name_suggested: "Acme Collections LLC",
  confidence: 85,
  reasoning: "FTC consumer complaint volume suggests Acme Collections LLC.",
};

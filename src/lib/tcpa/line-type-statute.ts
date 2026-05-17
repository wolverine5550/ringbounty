/**
 * Phase 7.6.3 — Map user-attested line type to TCPA §227(b) subsections.
 *
 * Used for claim-strength scoring and attorney evidence summaries only —
 * not for auto-generated demand letters (v0.1 has no letter product).
 */

/** User attestation values persisted on `claim_events.key` = `line_type`. */
export const LINE_TYPE_VALUES = ["mobile", "residential"] as const;

export type LineType = (typeof LINE_TYPE_VALUES)[number];

/** `claim_events.key` for Screen 5 attestation. */
export const LINE_TYPE_CLAIM_EVENT_KEY = "line_type" as const;

const LINE_TYPE_SET = new Set<string>(LINE_TYPE_VALUES);

export function isLineType(value: string | null | undefined): value is LineType {
  return typeof value === "string" && LINE_TYPE_SET.has(value);
}

/** TCPA statutory cite strings for evidence packages and scoring inputs. */
export const TCPA_STATUTE_MOBILE = "47 U.S.C. § 227(b)(1)(A)(iii)";
export const TCPA_STATUTE_RESIDENTIAL = "47 U.S.C. § 227(b)(1)(B)";

export type TcpaStatuteSubsection = {
  /** Full cite for attorney-facing summaries. */
  cite: string;
  /** Short token for logs and matrix keys. */
  token: "227b_1_A_iii" | "227b_1_B";
};

/**
 * Maps attested line type to the TCPA subsection counsel uses for cell vs residential calls.
 */
export function mapLineTypeToTcpaSubsection(
  lineType: LineType,
): TcpaStatuteSubsection {
  if (lineType === "mobile") {
    return { cite: TCPA_STATUTE_MOBILE, token: "227b_1_A_iii" };
  }
  return { cite: TCPA_STATUTE_RESIDENTIAL, token: "227b_1_B" };
}

/** Plain-language label for evidence PDFs (no outcome advice). */
export function lineTypeAttestationLabel(lineType: LineType): string {
  return lineType === "mobile"
    ? "User attested calls were to a mobile phone"
    : "User attested calls were to a home or landline";
}

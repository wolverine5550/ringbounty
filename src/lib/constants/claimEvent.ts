/**
 * Canonical `claim_events.event_type` values used in the PRD and task_manager.
 * The column is plain `text`; extend this list when new flows persist events.
 *
 * @see prd.md section 5 (`claim_events` + example rows)
 * @see task_manager.md §4.2.1 (`evidence_checklist_ack`)
 */
export const CLAIM_EVENT_TYPE_VALUES = [
  "dnc_check",
  "spam_db_match",
  "registered_agent_lookup",
  "qualification_answer",
  "value_calculated",
  "evidence_checklist_ack",
  "attorney_referral",
] as const;

export type ClaimEventType = (typeof CLAIM_EVENT_TYPE_VALUES)[number];

/**
 * Canonical `claim_events.source` values from the PRD DDL comment, plus `state_api`
 * which appears in the PRD example table for state registry results.
 *
 * `nomorobo` — primary spam / robocall reputation ([Nomorobo Enterprise API](https://www.nomorobo.com/api/), §5.3).
 * `twilio` — secondary phone intelligence via **Twilio Lookup v2** (§5.2).
 * `whitepages` — reverse phone company enrichment when spam merge has no name (§6.4.2).
 * `voicemail_transcription` — company extracted from uploaded voicemail audio (§7.5.4).
 *
 * @see prd.md section 5 (`claim_events` DDL and example rows)
 */
export const CLAIM_EVENT_SOURCE_VALUES = [
  "user_input",
  "voicemail_transcription",
  "ftc_api",
  "state_api",
  "nomorobo",
  "twilio",
  "whitepages",
  "opencorporates",
  "openrouter",
  "system",
] as const;

export type ClaimEventSource = (typeof CLAIM_EVENT_SOURCE_VALUES)[number];

/** Narrowing guard before inserting or parsing API payloads into `claim_events`. */
export function isClaimEventType(value: unknown): value is ClaimEventType {
  return (
    typeof value === "string" &&
    (CLAIM_EVENT_TYPE_VALUES as readonly string[]).includes(value)
  );
}

/** Narrowing guard for `claim_events.source`. */
export function isClaimEventSource(value: unknown): value is ClaimEventSource {
  return (
    typeof value === "string" &&
    (CLAIM_EVENT_SOURCE_VALUES as readonly string[]).includes(value)
  );
}

import { describe, expect, it } from "vitest";
import {
  CLAIM_EVENT_SOURCE_VALUES,
  CLAIM_EVENT_TYPE_VALUES,
  isClaimEventSource,
  isClaimEventType,
  type ClaimEventSource,
  type ClaimEventType,
} from "./claimEvent";

describe("claimEvent constants", () => {
  it("exposes unique claim event types aligned with PRD examples + checklist ack", () => {
    expect(CLAIM_EVENT_TYPE_VALUES).toHaveLength(9);
    expect(new Set(CLAIM_EVENT_TYPE_VALUES).size).toBe(9);
    expect(CLAIM_EVENT_TYPE_VALUES).toContain("dnc_check");
    expect(CLAIM_EVENT_TYPE_VALUES).toContain("registered_agent_lookup");
    expect(CLAIM_EVENT_TYPE_VALUES).toContain("qualification_answer");
    expect(CLAIM_EVENT_TYPE_VALUES).toContain("company_intelligence");
    expect(CLAIM_EVENT_TYPE_VALUES).toContain("evidence_checklist_ack");
    expect(CLAIM_EVENT_TYPE_VALUES).toContain("attorney_referral");
    expect(CLAIM_EVENT_TYPE_VALUES).toContain("firm_lead_dispute");
  });

  it("exposes unique sources including state_api from PRD examples", () => {
    expect(CLAIM_EVENT_SOURCE_VALUES).toContain("state_api");
    expect(new Set(CLAIM_EVENT_SOURCE_VALUES).size).toBe(
      CLAIM_EVENT_SOURCE_VALUES.length,
    );
  });

  it("isClaimEventType and isClaimEventSource narrow correctly", () => {
    const t: ClaimEventType = "spam_db_match";
    expect(isClaimEventType(t)).toBe(true);
    expect(isClaimEventType("unknown_type")).toBe(false);

    const s: ClaimEventSource = "ftc_api";
    expect(isClaimEventSource(s)).toBe(true);
    expect(isClaimEventSource("bogus")).toBe(false);
  });
});

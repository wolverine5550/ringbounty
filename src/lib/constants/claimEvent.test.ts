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
    expect(CLAIM_EVENT_TYPE_VALUES).toHaveLength(5);
    expect(new Set(CLAIM_EVENT_TYPE_VALUES).size).toBe(5);
    expect(CLAIM_EVENT_TYPE_VALUES).toContain("dnc_check");
    expect(CLAIM_EVENT_TYPE_VALUES).toContain("evidence_checklist_ack");
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

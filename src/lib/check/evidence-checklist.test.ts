import { describe, expect, it } from "vitest";

import { canProceedPastEvidenceChecklist } from "./evidence-checklist-gate";
import { EVIDENCE_CHECKLIST_ITEMS } from "./evidence-checklist-items";

describe("EVIDENCE_CHECKLIST_ITEMS", () => {
  it("defines six PRD §10 checklist rows with unique ids", () => {
    expect(EVIDENCE_CHECKLIST_ITEMS).toHaveLength(6);
    const ids = EVIDENCE_CHECKLIST_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(6);
  });
});

describe("canProceedPastEvidenceChecklist", () => {
  const total = EVIDENCE_CHECKLIST_ITEMS.length;

  it("allows proceed when every item is checked", () => {
    expect(canProceedPastEvidenceChecklist(total, total, false)).toBe(true);
  });

  it("blocks proceed when incomplete and user did not acknowledge", () => {
    expect(canProceedPastEvidenceChecklist(total - 1, total, false)).toBe(false);
    expect(canProceedPastEvidenceChecklist(0, total, false)).toBe(false);
  });

  it("allows proceed when user acknowledges continue-anyway", () => {
    expect(canProceedPastEvidenceChecklist(0, total, true)).toBe(true);
    expect(canProceedPastEvidenceChecklist(3, total, true)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { canContinueToNumberEntry } from "./evidence-checklist-gate";
import { EVIDENCE_CHECKLIST_ITEMS } from "./evidence-checklist-items";

describe("EVIDENCE_CHECKLIST_ITEMS", () => {
  it("defines six PRD §10 checklist rows with unique ids", () => {
    expect(EVIDENCE_CHECKLIST_ITEMS).toHaveLength(6);
    const ids = EVIDENCE_CHECKLIST_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(6);
  });
});

describe("canContinueToNumberEntry", () => {
  const total = EVIDENCE_CHECKLIST_ITEMS.length;

  it("allows continue when every item is checked", () => {
    expect(canContinueToNumberEntry(total, total, false)).toBe(true);
  });

  it("blocks continue when incomplete and user did not acknowledge", () => {
    expect(canContinueToNumberEntry(total - 1, total, false)).toBe(false);
    expect(canContinueToNumberEntry(0, total, false)).toBe(false);
  });

  it("allows continue when user acknowledges continue-anyway", () => {
    expect(canContinueToNumberEntry(0, total, true)).toBe(true);
    expect(canContinueToNumberEntry(3, total, true)).toBe(true);
  });
});

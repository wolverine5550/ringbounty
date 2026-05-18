import { describe, expect, it } from "vitest";

import {
  FDCPA_DEBT_COLLECTION_USER_MESSAGE,
  isDebtCollectionCallCategory,
  isTcpaLetterBlockedForCallCategory,
  TCPA_LETTER_BLOCKED_FDCPA_DEBT,
} from "./fdcpa-debt-collection";

describe("fdcpa-debt-collection (§5.7)", () => {
  it("detects debt collection categories and aliases", () => {
    expect(isDebtCollectionCallCategory("debt_collection")).toBe(true);
    expect(isDebtCollectionCallCategory("Debt Collector")).toBe(true);
    expect(isDebtCollectionCallCategory("political")).toBe(false);
    expect(isDebtCollectionCallCategory(null)).toBe(false);
  });

  it("blocks TCPA attorney referral for debt collection", () => {
    expect(isTcpaLetterBlockedForCallCategory("debt_collector")).toBe(true);
    expect(isTcpaLetterBlockedForCallCategory("telemarketer")).toBe(false);
  });

  it("mentions FDCPA and no TCPA referral without product promises", () => {
    expect(FDCPA_DEBT_COLLECTION_USER_MESSAGE).toMatch(/FDCPA/i);
    expect(FDCPA_DEBT_COLLECTION_USER_MESSAGE).toMatch(/cannot offer a TCPA/i);
    expect(FDCPA_DEBT_COLLECTION_USER_MESSAGE).not.toMatch(/coming soon|we will offer|launch/i);
  });

  it("exposes stable block token for claim_events", () => {
    expect(TCPA_LETTER_BLOCKED_FDCPA_DEBT).toBe("fdcpa_debt_collection");
  });
});

import { describe, expect, it } from "vitest";

import { parseLeadAcceptPaymentMetadata } from "./handle-lead-accept-payment-intent";
import {
  STRIPE_LEAD_ACCEPT_FLOW,
  STRIPE_LEAD_ACCEPT_META,
} from "./lead-accept-metadata";

describe("parseLeadAcceptPaymentMetadata (§13.5)", () => {
  it("parses lead accept metadata", () => {
    const parsed = parseLeadAcceptPaymentMetadata({
      [STRIPE_LEAD_ACCEPT_META.flow]: STRIPE_LEAD_ACCEPT_FLOW,
      [STRIPE_LEAD_ACCEPT_META.leadId]: "lead-1",
      [STRIPE_LEAD_ACCEPT_META.firmId]: "firm-1",
    });

    expect(parsed).toEqual({ leadId: "lead-1", firmId: "firm-1" });
  });

  it("returns null for unrelated payments", () => {
    expect(parseLeadAcceptPaymentMetadata({ ringbounty_flow: "other" })).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { buildEvidencePdfBuffer } from "./build-evidence-pdf-buffer";
import type { EvidencePdfContext } from "./load-evidence-pdf-context";

const minimalContext: EvidencePdfContext = {
  leadId: "lead-1",
  claimId: "claim-1",
  generatedAtIso: "2026-05-17T12:00:00.000Z",
  consumer: {
    fullName: "Test User",
    email: "test@example.com",
    state: "CA",
  },
  claim: {
    violationType: "tcpa",
    claimStrength: "moderate",
    strengthHeadline: "Moderate strength",
    valuationLow: "$500",
    valuationRealistic: "$1,000",
    valuationHigh: "$1,500",
  },
  subjects: [
    {
      subjectId: "sub-1",
      phoneNumber: "+15551234567",
      companyName: "Acme Corp",
      companyIdentified: true,
      callCategory: "telemarketing",
      registeredAgentName: "Agent LLC",
      registeredAgentAddress: "123 Main St",
      registeredAgentLookupSource: "opencorporates",
      spamSummary: "Listed in spam databases.",
      dncSummary: "Federal DNC registered.",
      federalDncScreenshotPath: null,
      voicemailAudioPath: null,
      companyIntelEvidenceLines: [
        "Suggested company: Acme Corp (confidence 85)",
        "Research summary: FTC seed match.",
        "Round 1: FTC consumer complaint database (high volume)",
      ],
    },
  ],
  qualificationLines: [{ label: "Gave direct consent to call", value: "No" }],
};

describe("buildEvidencePdfBuffer (§13.2.1)", () => {
  it("returns a non-empty PDF buffer", async () => {
    const buffer = await buildEvidencePdfBuffer(minimalContext);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });
});

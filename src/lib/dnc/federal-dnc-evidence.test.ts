import { describe, expect, it } from "vitest";

import {
  buildFederalDncConfirmationStoragePath,
  FEDERAL_DNC_EVIDENCE_MAX_BYTES,
  getFederalDncScreenshotPathFromMetadata,
  validateFederalDncEvidenceFile,
} from "./federal-dnc-evidence";

describe("federal-dnc-evidence (§6.2.4)", () => {
  it("builds storage path under user/claim/subject", () => {
    expect(
      buildFederalDncConfirmationStoragePath(
        "user-1",
        "claim-2",
        "subject-3",
        ".png",
      ),
    ).toBe("user-1/claim-2/subject-3/federal-dnc-confirmation.png");
  });

  it("accepts valid PNG under size limit", () => {
    expect(
      validateFederalDncEvidenceFile({
        size: 1024,
        type: "image/png",
        name: "ftc-email.png",
      }),
    ).toEqual({ ok: true, mimeType: "image/png", extension: ".png" });
  });

  it("rejects oversize files", () => {
    expect(
      validateFederalDncEvidenceFile({
        size: FEDERAL_DNC_EVIDENCE_MAX_BYTES + 1,
        type: "image/png",
        name: "big.png",
      }).ok,
    ).toBe(false);
  });

  it("rejects disallowed mime types", () => {
    expect(
      validateFederalDncEvidenceFile({
        size: 100,
        type: "application/pdf",
        name: "doc.pdf",
      }).ok,
    ).toBe(false);
  });

  it("reads screenshot path from subject metadata", () => {
    expect(
      getFederalDncScreenshotPathFromMetadata({
        federal_dnc_confirmation_screenshot_path:
          "uid/claim/sub/federal-dnc-confirmation.png",
      }),
    ).toBe("uid/claim/sub/federal-dnc-confirmation.png");
  });
});

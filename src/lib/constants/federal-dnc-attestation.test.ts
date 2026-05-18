import { describe, expect, it } from "vitest";

import {
  buildFederalDncReuseBodyWithPhone,
  FEDERAL_DNC_RECEIVING_LINE_NOTE,
} from "./federal-dnc-attestation";

describe("federal-dnc-attestation copy", () => {
  it("reuse body includes the saved receiving line", () => {
    expect(buildFederalDncReuseBodyWithPhone("(815) 545-7907")).toContain(
      "(815) 545-7907",
    );
  });

  it("receiving line note distinguishes screened caller from DNC line", () => {
    expect(FEDERAL_DNC_RECEIVING_LINE_NOTE).toContain("receiving line below");
  });
});

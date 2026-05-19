import { describe, expect, it } from "vitest";

import { confidenceLevelForFtcComplaintCount } from "./ftc-confidence-bucket";

describe("confidenceLevelForFtcComplaintCount (CI-2.1.3)", () => {
  it("maps count buckets per task manager", () => {
    expect(confidenceLevelForFtcComplaintCount(1)).toBe("ftc_complaint_low");
    expect(confidenceLevelForFtcComplaintCount(9)).toBe("ftc_complaint_low");
    expect(confidenceLevelForFtcComplaintCount(10)).toBe("ftc_complaint_medium");
    expect(confidenceLevelForFtcComplaintCount(99)).toBe("ftc_complaint_medium");
    expect(confidenceLevelForFtcComplaintCount(100)).toBe("ftc_complaint_high");
    expect(confidenceLevelForFtcComplaintCount(500)).toBe("ftc_complaint_high");
  });
});

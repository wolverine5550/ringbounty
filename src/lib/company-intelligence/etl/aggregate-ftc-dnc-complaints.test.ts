import { describe, expect, it } from "vitest";

import {
  aggregateFtcDncComplaints,
  aggregatesToSeedViolationRows,
} from "./aggregate-ftc-dnc-complaints";
import type { FtcDncComplaintRow } from "./types";

describe("aggregateFtcDncComplaints (CI-2.1.2 Path B)", () => {
  it("picks modal subject and sums counts per phone", () => {
    const rows: FtcDncComplaintRow[] = [
      {
        phoneNumberNormalized: "+18005551234",
        ftcSubject: "Other",
        isRobocall: true,
        violationAt: "2026-05-10 10:00:00",
        sourceFileDate: "2026-05-14",
      },
      {
        phoneNumberNormalized: "+18005551234",
        ftcSubject: "Other",
        isRobocall: true,
        violationAt: "2026-05-12 10:00:00",
        sourceFileDate: "2026-05-15",
      },
      {
        phoneNumberNormalized: "+18005551234",
        ftcSubject: "Reducing your debt",
        isRobocall: false,
        violationAt: "2026-05-11 10:00:00",
        sourceFileDate: "2026-05-15",
      },
    ];

    const aggregates = aggregateFtcDncComplaints(rows);
    expect(aggregates).toHaveLength(1);
    expect(aggregates[0]?.violationCount).toBe(3);
    expect(aggregates[0]?.modalFtcSubject).toBe("Other");
    expect(aggregates[0]?.robocallMajority).toBe(true);
    expect(aggregates[0]?.lastViolationAt).toBe("2026-05-12 10:00:00");
    expect(aggregates[0]?.sourceFileDates).toEqual(["2026-05-14", "2026-05-15"]);
  });
});

describe("aggregatesToSeedViolationRows (CI-2.1.3)", () => {
  it("sets reported_company_name null and metadata for Path B", () => {
    const aggregates = aggregateFtcDncComplaints([
      {
        phoneNumberNormalized: "+18005559999",
        ftcSubject: "Other",
        isRobocall: true,
        violationAt: null,
        sourceFileDate: "2026-05-15",
      },
    ]);

    const seedRows = aggregatesToSeedViolationRows(
      aggregates,
      new Date("2026-05-19T12:00:00.000Z"),
    );

    expect(seedRows[0]).toMatchObject({
      phone_number_normalized: "+18005559999",
      reported_company_name: null,
      source: "ftc_complaint",
      confidence_level: "ftc_complaint_low",
      violation_count: 1,
      metadata: {
        ftc_subject: "Other",
        complaint_count: 1,
        robocall_majority: true,
        source_file_dates: ["2026-05-15"],
      },
    });
  });

  it("uses medium/high confidence buckets at 10 and 100 counts", () => {
    const rows: FtcDncComplaintRow[] = Array.from({ length: 10 }, () => ({
      phoneNumberNormalized: "+12125550199",
      ftcSubject: "Other",
      isRobocall: true,
      violationAt: null,
      sourceFileDate: "2026-05-15",
    }));

    const medium = aggregatesToSeedViolationRows(
      aggregateFtcDncComplaints(rows),
    )[0];
    expect(medium?.confidence_level).toBe("ftc_complaint_medium");

    const highRows = Array.from({ length: 100 }, () => rows[0]!);
    const high = aggregatesToSeedViolationRows(
      aggregateFtcDncComplaints(highRows),
    )[0];
    expect(high?.confidence_level).toBe("ftc_complaint_high");
  });
});

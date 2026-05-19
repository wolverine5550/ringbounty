import { describe, expect, it } from "vitest";

import {
  ftcDailyCsvUrl,
  parseCsvLine,
  parseFtcDncCsv,
} from "./parse-ftc-dnc-csv";

const HEADER =
  "Company_Phone_Number,Created_Date,Violation_Date,Consumer_City,Consumer_State,Consumer_Area_Code,Subject,Recorded_Message_Or_Robocall";

describe("parseCsvLine (CI-2.1)", () => {
  it("parses quoted subject with commas", () => {
    const fields = parseCsvLine(
      '5702442900,2026-05-14 00:00:16,2026-05-13 11:38:00,,,570,No Subject Provided,Y',
    );
    expect(fields[6]).toBe("No Subject Provided");
  });
});

describe("parseFtcDncCsv (CI-2.1.2)", () => {
  it("normalizes phone to E.164 and drops empty phone rows", () => {
    const csv = [
      HEADER,
      "2244666921,2026-05-14 00:00:13,2026-05-13 16:19:00,Aurora,Colorado,303,Other,Y",
      ",2026-05-14 00:00:15,2026-05-13 00:00:00,Eureka,California,707,Other,Y",
    ].join("\n");

    const { rows, stats } = parseFtcDncCsv(csv, "2026-05-15");

    expect(stats.dataRows).toBe(2);
    expect(stats.skippedEmptyPhone).toBe(1);
    expect(stats.skippedInvalidPhone).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.phoneNumberNormalized).toBe("+12244666921");
    expect(rows[0]?.ftcSubject).toBe("Other");
    expect(rows[0]?.isRobocall).toBe(true);
    expect(rows[0]?.sourceFileDate).toBe("2026-05-15");
  });

  it("does not include consumer location fields in output", () => {
    const csv = `${HEADER}\n6124857053,2026-05-14 00:00:23,2026-05-12 13:24:00,saint cloud,Minnesota,320,"Lotteries, prizes  & sweepstakes",Y`;
    const { rows } = parseFtcDncCsv(csv, "2026-05-15");
    expect(rows[0]?.ftcSubject).toBe("Lotteries, prizes  & sweepstakes");
    expect(JSON.stringify(rows[0])).not.toContain("Minnesota");
  });
});

describe("ftcDailyCsvUrl (CI-2.1.1)", () => {
  it("builds FTC public daily URL", () => {
    expect(ftcDailyCsvUrl("2026-05-15")).toBe(
      "https://www.ftc.gov/sites/default/files/DNC_Complaint_Numbers_2026-05-15.csv",
    );
  });
});

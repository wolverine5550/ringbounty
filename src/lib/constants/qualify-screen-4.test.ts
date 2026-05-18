import { describe, expect, it } from "vitest";

import { buildQualifyQ14Prompt } from "./qualify-screen-4";

describe("buildQualifyQ14Prompt", () => {
  it("never mentions voicemail", () => {
    expect(buildQualifyQ14Prompt(true).toLowerCase()).not.toContain("voicemail");
    expect(buildQualifyQ14Prompt(false).toLowerCase()).not.toContain("voicemail");
    expect(buildQualifyQ14Prompt(null).toLowerCase()).not.toContain("voicemail");
  });

  it("varies copy when user already has voicemail to upload", () => {
    expect(buildQualifyQ14Prompt(true)).toContain("other notes");
    expect(buildQualifyQ14Prompt(false)).not.toContain("other notes");
  });
});

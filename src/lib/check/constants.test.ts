import { describe, expect, it } from "vitest";

import {
  CHECK_DEFAULT_ACTIVE_STEP_ID,
  CHECK_FLOW_STEPS,
  CHECK_STEP_ZERO_INTRO,
} from "./constants";

describe("check flow constants", () => {
  it("defines step 0 before number entry per PRD §10", () => {
    expect(CHECK_FLOW_STEPS[0]?.heading).toBe("Step 0 — Preserve evidence");
    expect(CHECK_FLOW_STEPS[1]?.heading).toBe("Step 1 — Enter numbers");
    expect(CHECK_DEFAULT_ACTIVE_STEP_ID).toBe(0);
  });

  it("includes non-guarantee framing on step zero intro", () => {
    expect(CHECK_STEP_ZERO_INTRO).toMatch(/do not guarantee/i);
  });
});

import { describe, expect, it } from "vitest";

import { FAQ_ENTRIES } from "./faq";
import { FAQ_NON_ADVICE_REMINDER } from "./non-advice-reminder";

describe("FAQ_ENTRIES", () => {
  it("covers required objection-handling topics (§3.3.1)", () => {
    const ids = FAQ_ENTRIES.map((entry) => entry.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "cost",
        "legality",
        "will-i-win",
        "time-to-pay",
        "dnc",
        "attorney",
      ]),
    );
  });

  it("appends non-advice reminder to each answer (§3.3.2)", () => {
    for (const entry of FAQ_ENTRIES) {
      expect(entry.answer.endsWith(FAQ_NON_ADVICE_REMINDER)).toBe(true);
    }
  });
});

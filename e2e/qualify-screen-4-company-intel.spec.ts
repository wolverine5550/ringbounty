/**
 * CI-8.5 — UNKNOWN number → Qualify step 4 shows Lane B suggestion or voicemail CTA.
 */

import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import {
  QUALIFY_INTEL_RESEARCHING_BANNER,
  QUALIFY_INTEL_SUGGEST_HEADING,
  QUALIFY_VOICEMAIL_PRIMARY_PROMPT,
} from "@/lib/constants/qualify-screen-4";
import { formatCompanyIntelConfidenceTierLabel } from "@/lib/qualify/company-intel-confidence-tier";
import { QUALIFY_COMPANY_INTEL_POLL_MS } from "@/lib/qualify/use-qualify-company-intel-poll";

import { MOCK_COMPANY_INTEL_SUGGESTION } from "./helpers/company-intel-mocks";
import { hasQualifyScreen4E2EEnv } from "./helpers/env";
import { E2E_FIXTURE_PATH } from "./helpers/fixture-paths";
import type { QualifyScreen4E2EFixture } from "./helpers/qualify-screen-4-fixture";

const describeQualifyE2E = hasQualifyScreen4E2EEnv() ? test.describe : test.describe.skip;

function buildScreen4Url(fixture: QualifyScreen4E2EFixture, subjectId: string): string {
  return `/qualify/${subjectId}?claim=${fixture.claimId}&step=4`;
}

async function loadFixture(): Promise<QualifyScreen4E2EFixture> {
  const raw = await readFile(E2E_FIXTURE_PATH, "utf8");
  return JSON.parse(raw) as QualifyScreen4E2EFixture;
}

describeQualifyE2E("Qualify Screen 4 — company intelligence UX (CI-8.5)", () => {
  test.describe.configure({ mode: "serial" });

  let fixture: QualifyScreen4E2EFixture;

  test.beforeAll(async () => {
    fixture = await loadFixture();
  });

  test("shows primary voicemail CTA when agent completed without a suggestion", async ({
    page,
  }) => {
    await page.goto(buildScreen4Url(fixture, fixture.voicemailCtaSubjectId));

    await expect(
      page.getByText(QUALIFY_VOICEMAIL_PRIMARY_PROMPT, { exact: true }),
    ).toBeVisible();
    await expect(page.locator("#company-name")).toHaveValue("");
  });

  test("polls mocked company-intel API and pre-fills Q13 suggestion", async ({
    page,
  }) => {
    await page.route("**/api/qualify/company-intel**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_COMPANY_INTEL_SUGGESTION),
      });
    });

    await page.goto(buildScreen4Url(fixture, fixture.pollingSubjectId));

    await expect(
      page.getByText(QUALIFY_INTEL_RESEARCHING_BANNER, { exact: true }),
    ).toBeVisible();

    await expect(
      page.getByText(QUALIFY_INTEL_SUGGEST_HEADING, { exact: true }),
    ).toBeVisible({ timeout: QUALIFY_COMPANY_INTEL_POLL_MS + 5_000 });

    await expect(
      page.getByText(formatCompanyIntelConfidenceTierLabel("high"), {
        exact: true,
      }),
    ).toBeVisible();

    await expect(page.locator("#company-name")).toHaveValue(
      MOCK_COMPANY_INTEL_SUGGESTION.company_name_suggested!,
    );
  });
});

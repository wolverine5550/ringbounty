/**
 * CI-8.5 — Seeds qualify Screen 4 fixtures when E2E env is configured.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadLocalEnv } from "@/lib/scripts/load-local-env";

import { hasQualifyScreen4E2EEnv } from "./helpers/env";
import { E2E_AUTH_STORAGE_PATH, E2E_FIXTURE_PATH } from "./helpers/fixture-paths";
import type { QualifyScreen4E2EFixture } from "./helpers/qualify-screen-4-fixture";
import { seedQualifyScreen4Fixture } from "./helpers/seed-qualify-screen-4-fixture";

const EMPTY_STORAGE_STATE = JSON.stringify({ cookies: [], origins: [] });

export default async function globalSetup(): Promise<void> {
  loadLocalEnv();

  await mkdir(path.dirname(E2E_AUTH_STORAGE_PATH), { recursive: true });

  if (!hasQualifyScreen4E2EEnv()) {
    await writeFile(E2E_AUTH_STORAGE_PATH, EMPTY_STORAGE_STATE, "utf8");
    return;
  }

  const fixture: QualifyScreen4E2EFixture = await seedQualifyScreen4Fixture();
  await writeFile(E2E_FIXTURE_PATH, JSON.stringify(fixture, null, 2), "utf8");
}

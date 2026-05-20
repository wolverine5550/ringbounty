import path from "node:path";

/** Written by `e2e/global-setup.ts`; read by qualify Screen 4 specs. */
export const E2E_FIXTURE_PATH = path.join(
  process.cwd(),
  "playwright",
  ".auth",
  "qualify-screen-4-fixture.json",
);

export const E2E_AUTH_STORAGE_PATH = path.join(
  process.cwd(),
  "playwright",
  ".auth",
  "user.json",
);

/**
 * Load `.env.local` / `.env` for CLI scripts (Next.js loads these automatically; `tsx` does not).
 * Existing `process.env` values are not overwritten.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/** Parse KEY=VALUE lines (no multiline / export prefix). */
export function parseEnvFile(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const raw = trimmed.slice(eq + 1).trim();
    out[key] = stripQuotes(raw);
  }
  return out;
}

/**
 * Merge project-root env files into `process.env` (`.env.local` then `.env`).
 */
export function loadLocalEnv(projectRoot = process.cwd()): void {
  for (const name of [".env.local", ".env"]) {
    const filePath = path.join(projectRoot, name);
    if (!existsSync(filePath)) {
      continue;
    }
    const parsed = parseEnvFile(readFileSync(filePath, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

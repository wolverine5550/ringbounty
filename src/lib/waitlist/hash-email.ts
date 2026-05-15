import { createHash } from "node:crypto";

/**
 * Normalizes and hashes an email for dedupe (§2.8.3).
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function hashEmail(normalizedEmail: string): string {
  return createHash("sha256").update(normalizedEmail, "utf8").digest("hex");
}

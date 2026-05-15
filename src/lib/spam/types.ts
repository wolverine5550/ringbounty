/**
 * Phase 5.1 — Shared contract for pluggable spam / reputation providers.
 * Primary MVP path: **Twilio REST** for reputation / spam signals (§5.2); YouMail remains a
 * separate adapter (§5.3). Map vendor responses into
 * `SpamCheckResult` so merge logic and storage stay provider-agnostic.
 */

/** Normalized outcome from a single spam-check vendor for one E.164 (or normalized) phone string. */
export interface SpamCheckResult {
  /** Whether the vendor classifies this number as spam / robocall / similar (vendor-specific semantics). */
  isSpam: boolean;
  /** Vendor confidence or risk score when available; `null` if the API does not expose one. */
  score: number | null;
  /** Reported complaint count when available; `null` otherwise. */
  complaints: number | null;
  /** Coarse category label from the vendor (e.g. telemarketer); `null` if unknown. */
  category: string | null;
  /** Display name for the caller / entity when the vendor supplies it. */
  companyName: string | null;
  /** Full vendor payload (or a safe subset) for audit / `claim_events`; keep JSON-serializable when possible. */
  raw: unknown;
  /** Stable id for this integration (e.g. `twilio`, `youmail`); used in logs and merged rows. */
  providerId: string;
}

/** One spam provider implementation; `phone` is expected to be normalized (e.g. E.164) before calling. */
export interface SpamCheckProvider {
  check(phone: string): Promise<SpamCheckResult>;
}

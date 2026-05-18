/**
 * Phase 13.8.2 — Notify ops when a consumer reports a firm contact issue (Resend).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { FirmContactDisputeReason } from "@/lib/constants/firm-contact-dispute";
import { FIRM_CONTACT_DISPUTE_REASON_LABELS } from "@/lib/constants/firm-contact-dispute";
import type { Database } from "@/types/database";

import {
  FIRM_LEAD_DISPUTE_EVENT_KEYS,
  FIRM_LEAD_DISPUTE_EVENT_TYPE,
} from "./firm-contact-dispute-claim-events";

export type SendFirmContactDisputeOpsEmailResult =
  | { status: "sent" }
  | { status: "skipped_not_configured" }
  | { status: "skipped_no_recipient" }
  | { status: "failed" };

const RESEND_API_URL = "https://api.resend.com/emails";

function parseOpsRecipients(): string[] {
  const raw = process.env.OPS_DISPUTE_EMAIL?.trim();
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

/**
 * Sends ops notification when `OPS_DISPUTE_EMAIL` and `RESEND_API_KEY` are set.
 */
export async function sendFirmContactDisputeOpsEmail(
  admin: SupabaseClient<Database>,
  params: {
    claimId: string;
    leadId: string;
    reason: FirmContactDisputeReason;
    details: string | null;
    userEmail: string | null | undefined;
    firmName: string | null;
  },
): Promise<SendFirmContactDisputeOpsEmailResult> {
  const recordStatus = async (value: string) => {
    await admin.from("claim_events").insert({
      claim_id: params.claimId,
      event_type: FIRM_LEAD_DISPUTE_EVENT_TYPE,
      key: FIRM_LEAD_DISPUTE_EVENT_KEYS.opsEmailStatus,
      value,
      source: "system",
    });
  };

  const recipients = parseOpsRecipients();
  if (recipients.length === 0) {
    await recordStatus("skipped_no_recipient");
    return { status: "skipped_no_recipient" };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    await recordStatus("skipped_not_configured");
    return { status: "skipped_not_configured" };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? "RingBounty <onboarding@resend.dev>";

  const reasonLabel = FIRM_CONTACT_DISPUTE_REASON_LABELS[params.reason];
  const lines = [
    "Consumer reported an issue with firm contact on RingBounty.",
    "",
    `Lead id: ${params.leadId}`,
    `Claim id: ${params.claimId}`,
    `Firm: ${params.firmName ?? "(unknown)"}`,
    `Consumer email: ${params.userEmail?.trim() || "(not provided)"}`,
    `Reason: ${reasonLabel} (${params.reason})`,
  ];

  if (params.details?.trim()) {
    lines.push("", "Details:", params.details.trim());
  }

  lines.push("", "— RingBounty (automated)");

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: `[RingBounty] Firm contact issue — lead ${params.leadId.slice(0, 8)}`,
        text: lines.join("\n"),
      }),
    });

    if (!res.ok) {
      await recordStatus("failed");
      return { status: "failed" };
    }

    await recordStatus("sent");
    return { status: "sent" };
  } catch {
    await recordStatus("failed");
    return { status: "failed" };
  }
}

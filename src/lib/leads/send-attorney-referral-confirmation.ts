/**
 * Phase 13.1.4 — Transactional email after attorney referral submit.
 * Uses Resend HTTP API when `RESEND_API_KEY` is configured.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ATTORNEY_REFERRAL_EVENT_KEYS,
  ATTORNEY_REFERRAL_EVENT_TYPE,
} from "@/lib/leads/attorney-referral-claim-events";
import type { Database } from "@/types/database";

export type SendAttorneyReferralConfirmationResult =
  | { status: "sent" }
  | { status: "skipped_not_configured" }
  | { status: "skipped_no_email" }
  | { status: "failed" };

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Sends a simple confirmation to the consumer and records status on `claim_events`.
 */
export async function sendAttorneyReferralConfirmation(
  admin: SupabaseClient<Database>,
  params: { claimId: string; userEmail: string | null | undefined },
): Promise<SendAttorneyReferralConfirmationResult> {
  const recordStatus = async (value: string) => {
    await admin.from("claim_events").insert({
      claim_id: params.claimId,
      event_type: ATTORNEY_REFERRAL_EVENT_TYPE,
      key: ATTORNEY_REFERRAL_EVENT_KEYS.confirmationEmailStatus,
      value,
      source: "system",
    });
  };

  if (!params.userEmail?.trim()) {
    await recordStatus("skipped_no_email");
    return { status: "skipped_no_email" };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    await recordStatus("skipped_not_configured");
    return { status: "skipped_not_configured" };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? "RingBounty <onboarding@resend.dev>";

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.userEmail.trim()],
        subject: "We received your attorney connection request",
        text: [
          "Thanks for submitting your request through RingBounty.",
          "",
          "We shared a summary of your claim information with participating attorneys for review.",
          "If an attorney is interested, they may contact you within about 48 hours.",
          "",
          "RingBounty is not a law firm and does not provide legal advice. We do not guarantee that any attorney will contact you or accept your case.",
          "",
          "— RingBounty",
        ].join("\n"),
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

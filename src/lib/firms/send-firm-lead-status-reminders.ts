import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const RESEND_API_URL = "https://api.resend.com/emails";
const REMINDER_AFTER_DAYS = 5;

export type SendFirmLeadStatusRemindersResult = {
  candidates: number;
  emailed: number;
  skippedNotConfigured: number;
};

type StaleLeadRow = {
  id: string;
  assigned_firm_id: string;
};

/**
 * §13.6.3 — Email firm users when a lead stays `accepted` with no status update for 5+ days.
 */
export async function sendFirmLeadStatusReminders(
  admin: SupabaseClient<Database>,
): Promise<SendFirmLeadStatusRemindersResult> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REMINDER_AFTER_DAYS);
  const cutoffIso = cutoff.toISOString();

  const { data: staleLeads, error: leadsError } = await admin
    .from("leads")
    .select("id, assigned_firm_id")
    .eq("status", "accepted")
    .is("firm_status_reminder_sent_at", null)
    .not("assigned_firm_id", "is", null)
    .lt("accepted_at", cutoffIso);

  if (leadsError) {
    throw leadsError;
  }

  const rows = (staleLeads ?? []) as StaleLeadRow[];
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? "RingBounty <onboarding@resend.dev>";

  let emailed = 0;
  let skippedNotConfigured = 0;

  for (const lead of rows) {
    const firmId = lead.assigned_firm_id;

    const { data: members, error: membersError } = await admin
      .from("firm_users")
      .select("email")
      .eq("firm_id", firmId);

    if (membersError) {
      throw membersError;
    }

    const recipients = (members ?? [])
      .map((m) => m.email?.trim())
      .filter((email): email is string => Boolean(email));

    if (!apiKey) {
      skippedNotConfigured += 1;
      await markReminderSent(admin, lead.id);
      continue;
    }

    if (recipients.length > 0) {
      const res = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: recipients,
          subject: "Reminder: update lead status in RingBounty",
          text: [
            "A lead you accepted more than 5 days ago is still marked as accepted.",
            "",
            "Please sign in to your firm inbox and update the status to contacted, retained, or closed.",
            "",
            "— RingBounty",
          ].join("\n"),
        }),
      });

      if (res.ok) {
        emailed += 1;
      }
    }

    await markReminderSent(admin, lead.id);
  }

  return {
    candidates: rows.length,
    emailed,
    skippedNotConfigured,
  };
}

async function markReminderSent(
  admin: SupabaseClient<Database>,
  leadId: string,
): Promise<void> {
  const { error } = await admin
    .from("leads")
    .update({ firm_status_reminder_sent_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    throw error;
  }
}

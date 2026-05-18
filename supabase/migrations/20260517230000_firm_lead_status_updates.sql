-- Phase 13.6 — Firm pipeline status updates + consumer visibility + reminder tracking.

alter table public.leads
  add column if not exists retained_at timestamptz,
  add column if not exists firm_status_reminder_sent_at timestamptz;

comment on column public.leads.retained_at is
  'When the assigned firm marked the consumer as retained (§13.6.1).';

comment on column public.leads.firm_status_reminder_sent_at is
  'When a 5-day no-status-update reminder was emailed to the firm (§13.6.3).';

-- §13.6.2 — Consumer `leads_select_consumer_own` already grants SELECT on own rows (status + timestamps).

-- §13.6.1 — Assigned firms may advance pipeline status (server validates transitions).
create policy leads_update_firm_assigned_status
  on public.leads
  for update
  to authenticated
  using (
    assigned_firm_id is not null
    and status in ('accepted', 'contacted', 'retained')
    and exists (
      select 1
      from public.firm_users as fu
      where fu.auth_user_id = (select auth.uid())
        and fu.firm_id = leads.assigned_firm_id
    )
  )
  with check (
    assigned_firm_id is not null
    and status in ('accepted', 'contacted', 'retained', 'closed')
    and exists (
      select 1
      from public.firm_users as fu
      where fu.auth_user_id = (select auth.uid())
        and fu.firm_id = leads.assigned_firm_id
    )
  );

create index leads_firm_status_reminder_idx
  on public.leads (accepted_at)
  where status = 'accepted'
    and firm_status_reminder_sent_at is null
    and assigned_firm_id is not null;

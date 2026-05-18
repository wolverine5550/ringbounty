-- Phase 13.5 — Lead accept payment, per-firm decline, PII unlock for assigned accepted leads.

-- Denormalized state for pool list/filters without widening `users` SELECT for pool rows.
alter table public.leads
  add column if not exists consumer_state text;

comment on column public.leads.consumer_state is
  'US state copied at referral time for firm pool filters (§13.4/13.5).';

update public.leads as l
set consumer_state = u.state
from public.users as u
where u.id = l.user_id
  and l.consumer_state is null
  and u.state is not null;

-- Per-firm decline hides a pool lead from that firm only (§13.5.3).
create table public.firm_lead_declines (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.law_firms (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  constraint firm_lead_declines_firm_lead_unique unique (firm_id, lead_id)
);

comment on table public.firm_lead_declines is
  'Firm-scoped decline of a pool lead; row stays in pool for other firms (§13.5.3).';

alter table public.firm_lead_declines enable row level security;

create policy firm_lead_declines_select_member
  on public.firm_lead_declines
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.firm_users as fu
      where fu.firm_id = firm_lead_declines.firm_id
        and fu.auth_user_id = (select auth.uid())
    )
  );

create policy firm_lead_declines_insert_member
  on public.firm_lead_declines
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.firm_users as fu
      where fu.firm_id = firm_lead_declines.firm_id
        and fu.auth_user_id = (select auth.uid())
    )
  );

grant select, insert on table public.firm_lead_declines to authenticated;
grant select, insert, update, delete on table public.firm_lead_declines to service_role;

-- Pool visibility: exclude leads this firm declined.
drop policy if exists leads_select_firm_pool on public.leads;

create policy leads_select_firm_pool
  on public.leads
  for select
  to authenticated
  using (
    assigned_firm_id is null
    and status in ('new', 'reviewed')
    and not exists (
      select 1
      from public.firm_lead_declines as d
      join public.firm_users as fu on fu.firm_id = d.firm_id
      where d.lead_id = leads.id
        and fu.auth_user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.firm_users as fu
      join public.law_firms as lf on lf.id = fu.firm_id
      where fu.auth_user_id = (select auth.uid())
        and lf.is_active = true
        -- Use leads.consumer_state (not public.users) to avoid RLS recursion — see 20260518140000_fix_leads_pool_rls_recursion.sql
        and leads.consumer_state is not null
        and (lf.target_states is null or leads.consumer_state = any (lf.target_states))
        and (
          lf.violation_types is null
          or leads.violation_type = any (lf.violation_types)
        )
        and (
          lf.min_claim_value_cents is null
          or coalesce(
            leads.estimated_value_realistic_cents,
            leads.estimated_value_low_cents,
            0
          ) >= lf.min_claim_value_cents
        )
        and (
          lf.min_claim_strength is null
          or (
            lf.min_claim_strength = 'strong'
            and leads.claim_strength = 'strong'
          )
          or (
            lf.min_claim_strength = 'moderate'
            and leads.claim_strength in ('strong', 'moderate')
          )
        )
    )
  );

-- §13.5.2 — Consumer profile PII after paid accept.
create policy users_select_for_firm_assigned_lead
  on public.users
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.leads as l
      join public.firm_users as fu on fu.firm_id = l.assigned_firm_id
      where l.user_id = users.id
        and l.assigned_firm_id is not null
        and l.status in ('accepted', 'contacted', 'retained', 'closed')
        and fu.auth_user_id = (select auth.uid())
    )
  );

create policy claim_subjects_select_for_firm_assigned_lead
  on public.claim_subjects
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.leads as l
      join public.firm_users as fu on fu.firm_id = l.assigned_firm_id
      where l.claim_id = claim_subjects.claim_id
        and l.assigned_firm_id is not null
        and l.status in ('accepted', 'contacted', 'retained', 'closed')
        and fu.auth_user_id = (select auth.uid())
    )
  );

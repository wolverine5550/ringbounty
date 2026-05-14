-- Phase 1.8 `claim_events` (prd.md section 5).
-- Flexible audit / funnel events; `event_type` and `source` literals documented in
-- src/lib/constants/claimEvent.ts.
-- RLS inherits access through parent `claims` row ownership (task_manager 1.11.4 pattern).
-- Explicit GRANTs for Data API rollout (May 30 / Oct 30, 2026).

create table public.claim_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  event_type text not null,
  key text,
  value text,
  source text,
  created_at timestamptz not null default now()
);

comment on table public.claim_events is
  'Append-only style event log per claim; event_type and source values are app-defined (see src/lib/constants/claimEvent.ts).';

create index claim_events_claim_id_event_type_created_at_idx
  on public.claim_events (claim_id, event_type, created_at);

alter table public.claim_events enable row level security;

create policy claim_events_select_via_claim
  on public.claim_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.claims as c
      where c.id = claim_events.claim_id
        and c.user_id = (select auth.uid())
    )
  );

create policy claim_events_insert_via_claim
  on public.claim_events
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.claims as c
      where c.id = claim_events.claim_id
        and c.user_id = (select auth.uid())
    )
  );

create policy claim_events_update_via_claim
  on public.claim_events
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.claims as c
      where c.id = claim_events.claim_id
        and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.claims as c
      where c.id = claim_events.claim_id
        and c.user_id = (select auth.uid())
    )
  );

create policy claim_events_delete_via_claim
  on public.claim_events
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.claims as c
      where c.id = claim_events.claim_id
        and c.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on table public.claim_events to authenticated;
grant select, insert, update, delete on table public.claim_events to service_role;

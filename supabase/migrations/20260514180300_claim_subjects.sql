-- Phase 1.6 `claim_subjects` (prd.md section 5).
-- RLS inherits access through parent `claims` row ownership (task_manager 1.11.4 pattern).
-- Explicit GRANTs for Data API rollout (May 30 / Oct 30, 2026).

create table public.claim_subjects (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  company_name text,
  company_identified boolean not null default false,
  registered_agent_name text,
  registered_agent_address text,
  registered_agent_lookup_source text,
  phone_number text,
  phone_number_normalized text,
  call_category text,
  is_exempt boolean not null default false,
  exempt_reason text,
  spam_db_confidence_score integer,
  spam_db_complaint_count integer,
  spam_db_source text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint claim_subjects_spam_confidence_range check (
    spam_db_confidence_score is null
    or (spam_db_confidence_score >= 0 and spam_db_confidence_score <= 100)
  )
);

comment on table public.claim_subjects is 'Per-company / per-number facts for a claim; call_category values documented in src/lib/constants/claimSubject.ts.';

create index claim_subjects_claim_id_idx on public.claim_subjects (claim_id);
create index claim_subjects_phone_normalized_idx on public.claim_subjects (phone_number_normalized)
  where phone_number_normalized is not null;

alter table public.claim_subjects enable row level security;

create policy claim_subjects_select_via_claim
  on public.claim_subjects
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.claims as c
      where c.id = claim_subjects.claim_id
        and c.user_id = (select auth.uid())
    )
  );

create policy claim_subjects_insert_via_claim
  on public.claim_subjects
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.claims as c
      where c.id = claim_subjects.claim_id
        and c.user_id = (select auth.uid())
    )
  );

create policy claim_subjects_update_via_claim
  on public.claim_subjects
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.claims as c
      where c.id = claim_subjects.claim_id
        and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.claims as c
      where c.id = claim_subjects.claim_id
        and c.user_id = (select auth.uid())
    )
  );

create policy claim_subjects_delete_via_claim
  on public.claim_subjects
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.claims as c
      where c.id = claim_subjects.claim_id
        and c.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on table public.claim_subjects to authenticated;
grant select, insert, update, delete on table public.claim_subjects to service_role;

-- Phase 1.7 `dnc_check_results` (prd.md section 5).
-- RLS inherits access through parent `claims` row ownership (task_manager 1.11.4 pattern).
-- Explicit GRANTs for Data API rollout (May 30 / Oct 30, 2026).

create table public.dnc_check_results (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  claim_subject_id uuid references public.claim_subjects (id) on delete cascade,
  phone_number_normalized text not null,

  federal_dnc_registered boolean,
  federal_dnc_registration_date date,
  federal_dnc_eligible boolean,
  federal_dnc_checked_at timestamptz,

  state_dnc_applicable boolean,
  state_dnc_registered boolean,
  state_dnc_state text,
  state_dnc_checked_at timestamptz,

  internal_dnc_violated boolean,
  internal_dnc_stop_request_method text,
  internal_dnc_stop_request_date date,

  created_at timestamptz not null default now()
);

comment on column public.dnc_check_results.claim_subject_id is
  'Nullable per PRD FK; when set, writers should keep claim_id equal to claim_subjects.claim_id for that subject.';

comment on table public.dnc_check_results is
  'DNC dimensions (federal, state, internal) for a claim; usually one row per claim_subject. Writers must align claim_id with claim_subjects.claim_id when claim_subject_id is set.';

comment on column public.dnc_check_results.federal_dnc_registered is
  'Null = not yet known or check not finished; false = ran / known not registered; true = registered.';

comment on column public.dnc_check_results.federal_dnc_registration_date is
  'Null when registration date unknown or federal check not completed.';

comment on column public.dnc_check_results.federal_dnc_eligible is
  'Null until evaluated (e.g. registered 31+ days before earliest call); false = ran and not eligible; true = eligible.';

comment on column public.dnc_check_results.federal_dnc_checked_at is
  'Null = federal DNC lookup never run; non-null = last federal check attempt time (outcome may still be null if API incomplete).';

comment on column public.dnc_check_results.state_dnc_applicable is
  'Null until evaluated; false = user state has no separate registry or not applicable; true = state registry applies.';

comment on column public.dnc_check_results.state_dnc_registered is
  'Null = not checked or unknown; false = checked and not on state list; true = on state list.';

comment on column public.dnc_check_results.state_dnc_checked_at is
  'Null = state DNC lookup never run; non-null = last state check time.';

comment on column public.dnc_check_results.internal_dnc_violated is
  'Null until internal "company stop list" screening done; false = no violation; true = continued after stop request.';

create index dnc_check_results_claim_id_idx on public.dnc_check_results (claim_id);
create index dnc_check_results_claim_subject_id_idx on public.dnc_check_results (claim_subject_id);

alter table public.dnc_check_results enable row level security;

create policy dnc_check_results_select_via_claim
  on public.dnc_check_results
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.claims as c
      where c.id = dnc_check_results.claim_id
        and c.user_id = (select auth.uid())
    )
  );

create policy dnc_check_results_insert_via_claim
  on public.dnc_check_results
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.claims as c
      where c.id = dnc_check_results.claim_id
        and c.user_id = (select auth.uid())
    )
  );

create policy dnc_check_results_update_via_claim
  on public.dnc_check_results
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.claims as c
      where c.id = dnc_check_results.claim_id
        and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.claims as c
      where c.id = dnc_check_results.claim_id
        and c.user_id = (select auth.uid())
    )
  );

create policy dnc_check_results_delete_via_claim
  on public.dnc_check_results
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.claims as c
      where c.id = dnc_check_results.claim_id
        and c.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on table public.dnc_check_results to authenticated;
grant select, insert, update, delete on table public.dnc_check_results to service_role;

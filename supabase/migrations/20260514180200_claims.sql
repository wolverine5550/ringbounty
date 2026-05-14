-- Phase 1.5 `claims` (prd.md section 5).
-- Includes RLS for authenticated owners, explicit GRANTs for Data API rollout (May 30 / Oct 30, 2026).

-- Shared trigger helper: bump updated_at on row change (reuse on other tables later).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is 'BEFORE UPDATE trigger: sets NEW.updated_at to now(). search_path locked.';

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  anonymous_session_id text,
  violation_type text not null references public.violation_types (id),
  status text not null default 'draft',
  claim_strength text,
  estimated_value_low_cents integer,
  estimated_value_high_cents integer,
  estimated_value_realistic_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint claims_status_check check (
    status in (
      'draft',
      'qualified',
      'letter_purchased',
      'letter_generated',
      'referred',
      'attorney_contacted',
      'retained',
      'closed'
    )
  ),
  constraint claims_claim_strength_check check (
    claim_strength is null
    or claim_strength in ('strong', 'moderate', 'weak', 'ineligible')
  )
);

comment on table public.claims is 'Consumer claim; user_id null for anonymous funnel rows (server-side writes via service role).';

create unique index claims_anonymous_session_unique
  on public.claims (anonymous_session_id)
  where user_id is null and anonymous_session_id is not null;

create index claims_user_id_idx on public.claims (user_id);
create index claims_violation_type_idx on public.claims (violation_type);
create index claims_status_idx on public.claims (status);
create index claims_anonymous_session_id_idx on public.claims (anonymous_session_id)
  where anonymous_session_id is not null;

create trigger claims_set_updated_at
  before update on public.claims
  for each row
  execute function public.set_updated_at();

alter table public.claims enable row level security;

-- Authenticated users: own rows only (user_id must match auth user).
create policy claims_select_own
  on public.claims
  for select
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy claims_insert_own
  on public.claims
  for insert
  to authenticated
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

create policy claims_update_own
  on public.claims
  for update
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

create policy claims_delete_own
  on public.claims
  for delete
  to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()));

-- No GRANT to anon: anonymous funnel uses service role on the server (task_manager 1.11.3).
grant select, insert, update, delete on table public.claims to authenticated;
grant select, insert, update, delete on table public.claims to service_role;

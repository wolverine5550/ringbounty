-- Phase 1.10.2 `firm_users` (prd.md section 5, v0.2 + task_manager nullable auth link).
-- RLS default deny (task_manager 1.10.4); prefer auth_user_id for RLS joins over email-only JWT claims.

create table public.firm_users (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.law_firms (id) on delete cascade,
  email text not null,
  full_name text,
  auth_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint firm_users_email_unique unique (email)
);

comment on table public.firm_users is
  'Firm portal users (v0.2). auth_user_id links to Supabase Auth when onboarded; nullable until linked.';

comment on column public.firm_users.auth_user_id is
  'FK to auth.users; use for RLS (task_manager 1.11.6) instead of trusting JWT email alone.';

create index firm_users_firm_id_idx on public.firm_users (firm_id);
create index firm_users_auth_user_id_idx on public.firm_users (auth_user_id)
  where auth_user_id is not null;

alter table public.firm_users enable row level security;

grant select, insert, update, delete on table public.firm_users to service_role;
grant select, insert, update, delete on table public.firm_users to authenticated;

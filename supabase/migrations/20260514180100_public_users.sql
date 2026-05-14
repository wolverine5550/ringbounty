-- Phase 1.4 `public.users` aligned with Auth (prd.md section 5; task_manager 1.4).
-- Explicit GRANTs for PostgREST / supabase-js (Data API default-deny rollout: May 30 / Oct 30, 2026).

create table public.users (
  id uuid not null primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is 'App-facing user profile; id matches auth.users; rows created/updated via Auth trigger.';

alter table public.users enable row level security;

create policy "users_select_own"
  on public.users
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "users_update_own"
  on public.users
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select, update on table public.users to authenticated;
grant select, insert, update, delete on table public.users to service_role;

create or replace function public.sync_auth_user_to_public_users()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_full_name text;
  v_state text;
begin
  v_email := coalesce(
    nullif(trim(new.email::text), ''),
    'pending+' || replace(new.id::text, '-', '') || '@ringbounty.local'
  );
  v_full_name := nullif(
    trim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')),
    ''
  );
  v_state := nullif(trim(coalesce(new.raw_user_meta_data->>'state', '')), '');

  insert into public.users (id, email, full_name, state, created_at, updated_at)
  values (
    new.id,
    v_email,
    v_full_name,
    v_state,
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name),
    state = coalesce(excluded.state, public.users.state),
    updated_at = now();

  return new;
end;
$$;

comment on function public.sync_auth_user_to_public_users() is 'Upserts public.users from auth.users (email + raw_user_meta_data display fields). SECURITY DEFINER; search_path locked.';

drop trigger if exists ringbounty_on_auth_user_created on auth.users;
drop trigger if exists ringbounty_on_auth_user_updated on auth.users;

create trigger ringbounty_on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.sync_auth_user_to_public_users();

create trigger ringbounty_on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row
  execute procedure public.sync_auth_user_to_public_users();

insert into public.users (id, email, full_name, state, created_at, updated_at)
select
  u.id,
  coalesce(
    nullif(trim(u.email::text), ''),
    'pending+' || replace(u.id::text, '-', '') || '@ringbounty.local'
  ),
  nullif(
    trim(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')),
    ''
  ),
  nullif(trim(coalesce(u.raw_user_meta_data->>'state', '')), ''),
  coalesce(u.created_at, now()),
  now()
from auth.users as u
on conflict (id) do nothing;

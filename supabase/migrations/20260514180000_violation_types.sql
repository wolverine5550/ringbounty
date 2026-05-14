-- Phase 1.3 `violation_types` (prd.md section 5).
-- Explicit GRANTs for PostgREST / supabase-js (Data API default-deny rollout: May 30 / Oct 30, 2026).

create table public.violation_types (
  id text primary key,
  label text not null,
  description text,
  statute text,
  standard_damages_cents integer,
  willful_damages_cents integer,
  statute_of_limitations_years integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.violation_types is 'Per-violation vertical config; seeded from prd.md section 5.';

insert into public.violation_types (
  id,
  label,
  description,
  statute,
  standard_damages_cents,
  willful_damages_cents,
  statute_of_limitations_years,
  is_active,
  created_at
)
values
  (
    'tcpa',
    'Spam Call (TCPA)',
    'Illegal robocall or spam call',
    '47 U.S.C. sec. 227',
    50000,
    150000,
    4,
    true,
    now()
  ),
  (
    'wage_theft',
    'Unpaid Wages',
    'Unpaid overtime or wage violations',
    '29 U.S.C. sec. 201',
    null,
    null,
    3,
    false,
    now()
  ),
  (
    'data_breach',
    'Data Breach Settlement',
    'Personal data exposed in a breach with open settlement',
    null,
    null,
    null,
    null,
    false,
    now()
  )
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  statute = excluded.statute,
  standard_damages_cents = excluded.standard_damages_cents,
  willful_damages_cents = excluded.willful_damages_cents,
  statute_of_limitations_years = excluded.statute_of_limitations_years,
  is_active = excluded.is_active;

alter table public.violation_types enable row level security;

create policy "violation_types_select_reference"
  on public.violation_types
  for select
  to anon, authenticated
  using (true);

grant select on table public.violation_types to anon, authenticated;
grant select, insert, update, delete on table public.violation_types to service_role;

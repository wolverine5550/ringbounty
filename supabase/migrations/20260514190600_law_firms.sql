-- Phase 1.10.1 `law_firms` (prd.md section 5, v0.2).
-- RLS enabled with no policies yet (task_manager 1.10.4 default deny until firm features ship).
-- Explicit GRANTs for Data API rollout (May 30 / Oct 30, 2026); policies will gate access later.

create table public.law_firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text not null,
  target_states text[],
  violation_types text[],
  min_claim_value_cents integer,
  min_claim_strength text,
  lead_fee_cents integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint law_firms_min_claim_strength_check check (
    min_claim_strength is null
    or min_claim_strength in ('strong', 'moderate')
  )
);

comment on table public.law_firms is
  'Attorney network firm profile (v0.2). RLS default-deny: add firm-scoped policies when referral UI ships.';

comment on column public.law_firms.min_claim_strength is
  'Optional floor: strong | moderate (prd.md).';

create index law_firms_is_active_idx on public.law_firms (is_active);

alter table public.law_firms enable row level security;

grant select, insert, update, delete on table public.law_firms to service_role;
grant select, insert, update, delete on table public.law_firms to authenticated;

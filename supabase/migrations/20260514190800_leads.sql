-- Phase 1.10.3 `leads` (prd.md section 5, v0.2).
-- RLS default deny (task_manager 1.10.4). Reuses public.set_updated_at from claims migration.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  violation_type text not null references public.violation_types (id),
  status text not null default 'new',
  assigned_firm_id uuid references public.law_firms (id) on delete set null,
  evidence_pdf_url text,
  estimated_value_low_cents integer,
  estimated_value_high_cents integer,
  estimated_value_realistic_cents integer,
  claim_strength text,
  stripe_payment_intent_id text,
  lead_fee_cents integer,
  accepted_at timestamptz,
  contacted_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_status_check check (
    status in (
      'new',
      'reviewed',
      'accepted',
      'contacted',
      'retained',
      'closed',
      'declined'
    )
  ),
  constraint leads_claim_strength_check check (
    claim_strength is null
    or claim_strength in ('strong', 'moderate', 'weak', 'ineligible')
  )
);

comment on table public.leads is
  'Referral / firm pipeline row (v0.2). Status lifecycle: new → reviewed → accepted → contacted → retained | closed | declined.';

create index leads_claim_id_idx on public.leads (claim_id);
create index leads_user_id_idx on public.leads (user_id);
create index leads_assigned_firm_id_idx on public.leads (assigned_firm_id)
  where assigned_firm_id is not null;
create index leads_status_idx on public.leads (status);

create trigger leads_set_updated_at
  before update on public.leads
  for each row
  execute function public.set_updated_at();

alter table public.leads enable row level security;

grant select, insert, update, delete on table public.leads to service_role;
grant select, insert, update, delete on table public.leads to authenticated;

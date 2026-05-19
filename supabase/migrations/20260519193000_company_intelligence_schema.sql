-- CI-0.1 — Company Intelligence schema: seed cache, async runs, subject suggest fields.
-- Worker claim RPC aligns with CI-P.6.1 / worker-policy.ts (max 3 attempts, batch 1–25).
-- Explicit GRANTs for Data API rollout (May 30 / Oct 30, 2026).

-- ---------------------------------------------------------------------------
-- CI-0.1.1 — Proprietary seed cache (FTC bulk, agent write-back, future sources)
-- ---------------------------------------------------------------------------
create table public.seed_violations (
  phone_number_normalized text primary key,
  reported_company_name text,
  confidence_level text not null,
  violation_count integer not null default 0,
  source text not null,
  litigation_status text,
  last_refreshed_at timestamptz not null default now(),
  metadata jsonb,
  constraint seed_violations_violation_count_nonneg check (violation_count >= 0),
  constraint seed_violations_litigation_status_check check (
    litigation_status is null
    or litigation_status in (
      'under_investigation',
      'active_lawsuit',
      'settled',
      'judgment'
    )
  )
);

comment on table public.seed_violations is
  'Compounding phone → violation intel cache (FTC ETL, agent write-back). Path B FTC: reported_company_name often null; category in metadata. service_role only.';

comment on column public.seed_violations.confidence_level is
  'Tier label for UX/scoring (e.g. ftc_complaint_high, ftc_enforcement) — see company-intelligence/confidence.ts.';

create index seed_violations_last_refreshed_at_idx
  on public.seed_violations (last_refreshed_at desc);

alter table public.seed_violations enable row level security;

-- ---------------------------------------------------------------------------
-- CI-0.1.2 — Per-subject agent run history + worker queue
-- ---------------------------------------------------------------------------
create table public.company_intelligence_runs (
  id uuid primary key default gen_random_uuid(),
  claim_subject_id uuid not null references public.claim_subjects (id) on delete cascade,
  phone_number_normalized text not null,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  next_attempt_at timestamptz,
  started_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now(),
  sources_queried jsonb,
  raw_results jsonb,
  synthesized_company_name text,
  synthesized_confidence integer,
  synthesized_reasoning text,
  callback_numbers text[],
  is_spoofed_pool boolean,
  duration_ms integer,
  openrouter_prompt text,
  openrouter_response text,
  created_at timestamptz not null default now(),
  constraint company_intelligence_runs_status_check check (
    status in ('pending', 'running', 'completed', 'failed')
  ),
  constraint company_intelligence_runs_attempt_count_nonneg check (attempt_count >= 0),
  constraint company_intelligence_runs_synthesized_confidence_range check (
    synthesized_confidence is null
    or (synthesized_confidence >= 0 and synthesized_confidence <= 100)
  ),
  constraint company_intelligence_runs_duration_ms_nonneg check (
    duration_ms is null
    or duration_ms >= 0
  )
);

comment on table public.company_intelligence_runs is
  'Lane B async Company Intelligence Agent runs. Claimed by claim_company_intelligence_runs RPC (CI-P.6).';

create index company_intelligence_runs_claim_subject_id_idx
  on public.company_intelligence_runs (claim_subject_id);

-- CI-0.1.5 / CI-P.6.3 — cron drain claim query
create index company_intelligence_runs_pending_claim_idx
  on public.company_intelligence_runs (next_attempt_at, created_at)
  where status = 'pending';

alter table public.company_intelligence_runs enable row level security;

-- ---------------------------------------------------------------------------
-- CI-0.1.3 — Subject-level suggest-only fields (v1; distinct from company_name)
-- ---------------------------------------------------------------------------
alter table public.claim_subjects
  add column company_intel_status text,
  add column company_intel_confidence integer,
  add column company_intel_reasoning text,
  add column company_name_suggested text;

comment on column public.claim_subjects.company_intel_status is
  'Lane B agent lifecycle: pending | running | completed | failed. Mirrors company_intelligence_runs.status.';

comment on column public.claim_subjects.company_name_suggested is
  'Agent-suggested legal entity name (CI-P.4 suggest-only). Does not set company_identified until Q13/voicemail/Nomorobo.';

alter table public.claim_subjects
  add constraint claim_subjects_company_intel_status_check check (
    company_intel_status is null
    or company_intel_status in ('pending', 'running', 'completed', 'failed')
  );

alter table public.claim_subjects
  add constraint claim_subjects_company_intel_confidence_range check (
    company_intel_confidence is null
    or (company_intel_confidence >= 0 and company_intel_confidence <= 100)
  );

-- ---------------------------------------------------------------------------
-- CI-0.1.4 — RLS: service_role worker writes; authenticated read own runs
-- ---------------------------------------------------------------------------

-- seed_violations: no authenticated policies (default deny); worker reads via service_role.
create policy company_intelligence_runs_select_via_claim
  on public.company_intelligence_runs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.claim_subjects as cs
      join public.claims as c on c.id = cs.claim_id
      where cs.id = company_intelligence_runs.claim_subject_id
        and c.user_id = (select auth.uid())
    )
  );

-- Worker inserts/updates via service_role (bypasses RLS). No authenticated write policies.

-- ---------------------------------------------------------------------------
-- CI-P.6.1 — Atomic pending-run claim (FOR UPDATE SKIP LOCKED)
-- ---------------------------------------------------------------------------
create or replace function public.claim_company_intelligence_runs(
  p_batch_size integer default 5
)
returns setof public.company_intelligence_runs
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_batch_size < 1 or p_batch_size > 25 then
    raise exception 'invalid batch size';
  end if;

  return query
  with candidates as (
    select r.id
    from public.company_intelligence_runs as r
    where r.status = 'pending'
      and r.attempt_count < 3
      and (r.next_attempt_at is null or r.next_attempt_at <= now())
    order by r.created_at
    for update skip locked
    limit p_batch_size
  )
  update public.company_intelligence_runs as r
  set
    status = 'running',
    started_at = coalesce(r.started_at, now()),
    updated_at = now()
  from candidates as c
  where r.id = c.id
  returning r.*;
end;
$$;

comment on function public.claim_company_intelligence_runs is
  'Claims pending company_intelligence_runs for cron drain. service_role only. Max 3 attempts (worker-policy.ts).';

revoke all on function public.claim_company_intelligence_runs(integer) from public;
revoke all on function public.claim_company_intelligence_runs(integer) from anon, authenticated;
grant execute on function public.claim_company_intelligence_runs(integer) to service_role;

-- ---------------------------------------------------------------------------
-- Grants (CI-0.1.4 / Data API rollout)
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on table public.seed_violations to service_role;

grant select on table public.company_intelligence_runs to authenticated;
grant select, insert, update, delete on table public.company_intelligence_runs to service_role;

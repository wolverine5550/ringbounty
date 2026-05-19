-- CI-6.1 — Callback recursive lookup: child runs linked to parent synthesis.

alter table public.company_intelligence_runs
  add column parent_run_id uuid references public.company_intelligence_runs (id) on delete set null,
  add column run_metadata jsonb;

comment on column public.company_intelligence_runs.parent_run_id is
  'When set, this run researches a callback number from parent synthesis (CI-6.1). One level only — children do not enqueue further callbacks.';

comment on column public.company_intelligence_runs.run_metadata is
  'Run-level metadata (e.g. parent callback_resolved_from after child identifies company — CI-6.1.3).';

create index company_intelligence_runs_parent_run_id_idx
  on public.company_intelligence_runs (parent_run_id)
  where parent_run_id is not null;

create index company_intelligence_runs_subject_phone_idx
  on public.company_intelligence_runs (claim_subject_id, phone_number_normalized);

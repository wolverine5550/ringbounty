-- CI-4.3 — Per-run estimated paid API cost (SerpAPI + OpenRouter) for ops / O3 circuit breaker.

alter table public.company_intelligence_runs
  add column estimated_cost_cents integer,
  add column apis_called text[];

comment on column public.company_intelligence_runs.estimated_cost_cents is
  'Estimated marginal cost in USD cents for billable Lane B APIs on this run (CI-4.3). Zero when only free rounds.';

comment on column public.company_intelligence_runs.apis_called is
  'Billable API ids invoked on this run, e.g. serpapi, openrouter (CI-4.3).';

alter table public.company_intelligence_runs
  add constraint company_intelligence_runs_estimated_cost_cents_nonneg check (
    estimated_cost_cents is null
    or estimated_cost_cents >= 0
  );

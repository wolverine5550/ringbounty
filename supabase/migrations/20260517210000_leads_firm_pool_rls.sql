-- Phase 13.4.4 — Firm pool visibility + Realtime on `leads`.
-- Model: broadcast pool (unassigned `new`/`reviewed` rows matching firm criteria) plus
-- existing `leads_select_firm_assigned` for rows with `assigned_firm_id` set (§13.5 accept).

-- Pool: matching firms may read unassigned pipeline leads (no consumer PII columns widened here).
create policy leads_select_firm_pool
  on public.leads
  for select
  to authenticated
  using (
    assigned_firm_id is null
    and status in ('new', 'reviewed')
    and exists (
      select 1
      from public.firm_users as fu
      join public.law_firms as lf on lf.id = fu.firm_id
      join public.users as u on u.id = leads.user_id
      where fu.auth_user_id = (select auth.uid())
        and lf.is_active = true
        and u.state is not null
        and (lf.target_states is null or u.state = any (lf.target_states))
        and (
          lf.violation_types is null
          or leads.violation_type = any (lf.violation_types)
        )
        and (
          lf.min_claim_value_cents is null
          or coalesce(
            leads.estimated_value_realistic_cents,
            leads.estimated_value_low_cents,
            0
          ) >= lf.min_claim_value_cents
        )
        and (
          lf.min_claim_strength is null
          or (
            lf.min_claim_strength = 'strong'
            and leads.claim_strength = 'strong'
          )
          or (
            lf.min_claim_strength = 'moderate'
            and leads.claim_strength in ('strong', 'moderate')
          )
        )
    )
  );

-- Realtime: firm dashboard INSERT notifications (RLS still applies to payloads).
alter publication supabase_realtime add table public.leads;

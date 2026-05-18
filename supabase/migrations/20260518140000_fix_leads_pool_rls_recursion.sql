-- Fix infinite RLS recursion on `leads` (42P17).
-- `leads_select_firm_pool` joined `users`; `users_select_for_firm_assigned_lead` reads `leads` → cycle.
-- Use denormalized `consumer_state` on `leads` (§13.5) instead of joining `public.users`.

drop policy if exists leads_select_firm_pool on public.leads;

create policy leads_select_firm_pool
  on public.leads
  for select
  to authenticated
  using (
    assigned_firm_id is null
    and status in ('new', 'reviewed')
    and not exists (
      select 1
      from public.firm_lead_declines as d
      join public.firm_users as fu on fu.firm_id = d.firm_id
      where d.lead_id = leads.id
        and fu.auth_user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.firm_users as fu
      join public.law_firms as lf on lf.id = fu.firm_id
      where fu.auth_user_id = (select auth.uid())
        and lf.is_active = true
        and leads.consumer_state is not null
        and (lf.target_states is null or leads.consumer_state = any (lf.target_states))
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

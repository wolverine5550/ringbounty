-- Phase 1.11.6: `leads` read paths for consumers vs assigned firms (task_manager 1.11.6).
-- `firm_users` self-read enables EXISTS checks on `leads` without widening firm directory access.
-- `law_firms` member read supports firm portal listing the firm row tied to `firm_users`.

-- Firm users: only rows linked to the signed-in auth user (nullable auth_user_id stays invisible here).
create policy firm_users_select_self
  on public.firm_users
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and auth_user_id = (select auth.uid())
  );

-- Law firm profile: visible when the caller is a linked firm_users row for that firm.
create policy law_firms_select_for_member
  on public.law_firms
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.firm_users as fu
      where fu.firm_id = law_firms.id
        and fu.auth_user_id = (select auth.uid())
    )
  );

-- Consumer: own referral rows.
create policy leads_select_consumer_own
  on public.leads
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

-- Firm portal: assigned pipeline rows only (assigned_firm_id must match membership).
create policy leads_select_firm_assigned
  on public.leads
  for select
  to authenticated
  using (
    assigned_firm_id is not null
    and exists (
      select 1
      from public.firm_users as fu
      where fu.auth_user_id = (select auth.uid())
        and fu.firm_id = leads.assigned_firm_id
    )
  );

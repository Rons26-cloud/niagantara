-- ============================================================================
-- 014_company_plans.sql
-- Adds subscription plan columns to the companies table and backfills
-- existing rows. Functions (get_plan_limits, check_company_limit) are
-- created in migration 013 because provision_company depends on them.
-- ============================================================================

-- 1. Add plan-related columns to companies
alter table public.companies
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'business', 'enterprise')),
  add column if not exists plan_limits jsonb not null default '{}',
  add column if not exists plan_changed_at timestamptz;

comment on column public.companies.plan is 'Subscription plan: free, business, or enterprise.';
comment on column public.companies.plan_limits is 'Resource limits for the current plan as JSON: {max_stores, max_branches, max_employees, max_products, max_users}.';

-- 2. Define the plan RPCs here as well as in the provision migration. Some
-- environments applied an earlier revision of migration 013, so migration 014
-- must be independently deployable and idempotent.
create or replace function public.get_plan_limits(p_plan text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case p_plan
    when 'business' then '{
      "max_stores": 10,
      "max_branches": 50,
      "max_employees": 100,
      "max_products": 5000,
      "max_users": 25
    }'::jsonb
    when 'enterprise' then '{
      "max_stores": 999,
      "max_branches": 999,
      "max_employees": 9999,
      "max_products": 99999,
      "max_users": 999
    }'::jsonb
    else '{
      "max_stores": 2,
      "max_branches": 5,
      "max_employees": 10,
      "max_products": 100,
      "max_users": 3
    }'::jsonb
  end;
$$;

revoke all on function public.get_plan_limits(text) from public, anon, authenticated;
grant execute on function public.get_plan_limits(text) to service_role;

create or replace function public.check_company_limit(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_count bigint;
  v_max_companies constant int := 5;
begin
  select count(*) into v_company_count
  from public.company_members as member
  where member.user_id = p_user_id
    and member.role_key = 'owner'
    and member.status = 'active';

  return jsonb_build_object(
    'current_count', v_company_count,
    'max_allowed', v_max_companies,
    'can_create', v_company_count < v_max_companies
  );
end;
$$;

revoke all on function public.check_company_limit(uuid) from public, anon, authenticated;
grant execute on function public.check_company_limit(uuid) to service_role;

-- 3. Backfill plan_limits for existing companies that have empty limits
update public.companies
set plan_limits = public.get_plan_limits(plan)
where plan_limits = '{}'::jsonb;

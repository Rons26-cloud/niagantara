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

-- 2. Backfill plan_limits for existing companies that have empty limits
update public.companies
set plan_limits = public.get_plan_limits(plan)
where plan_limits = '{}'::jsonb;

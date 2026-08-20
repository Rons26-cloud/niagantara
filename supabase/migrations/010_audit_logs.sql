create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  branch_id uuid,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  request_id text,
  created_at timestamptz not null default now(),
  foreign key (branch_id, company_id) references public.branches(id, company_id) on delete set null (branch_id)
);

create index audit_logs_tenant_idx on public.audit_logs(company_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs(actor_user_id, created_at desc);
alter table public.audit_logs enable row level security;
revoke all on table public.audit_logs from anon, authenticated;
grant select on table public.audit_logs to authenticated;

create policy audit_logs_admin_read
on public.audit_logs for select
to authenticated
using (
  actor_user_id = (select auth.uid())
  or (select private.has_company_role(company_id, array['owner', 'company_admin', 'auditor']::text[]))
);

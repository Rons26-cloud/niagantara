create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create index security_events_lookup_idx on public.security_events(event_type, created_at desc);
create index security_events_tenant_idx on public.security_events(company_id, created_at desc);
alter table public.security_events enable row level security;
revoke all on table public.security_events from anon, authenticated;
grant select on table public.security_events to authenticated;

create policy security_events_admin_read
on public.security_events for select
to authenticated
using (
  actor_user_id = (select auth.uid())
  or (select private.has_company_role(company_id, array['owner', 'company_admin', 'auditor']::text[]))
);

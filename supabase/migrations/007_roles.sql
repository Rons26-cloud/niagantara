create table public.roles (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('platform', 'company', 'branch')),
  role_key text not null,
  display_name text not null,
  unique (scope, role_key)
);

alter table public.roles enable row level security;
revoke all on table public.roles from anon, authenticated;
grant select on table public.roles to authenticated;

create policy roles_authenticated_read
on public.roles for select
to authenticated
using (true);

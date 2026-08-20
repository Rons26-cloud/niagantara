create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create index role_permissions_permission_idx on public.role_permissions(permission_id, role_id);
alter table public.role_permissions enable row level security;
revoke all on table public.role_permissions from anon, authenticated;
grant select on table public.role_permissions to authenticated;

create policy role_permissions_authenticated_read
on public.role_permissions for select
to authenticated
using (true);

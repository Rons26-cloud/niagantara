create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  permission_key text not null unique,
  display_name text not null
);

alter table public.permissions enable row level security;
revoke all on table public.permissions from anon, authenticated;
grant select on table public.permissions to authenticated;

create policy permissions_authenticated_read
on public.permissions for select
to authenticated
using (true);

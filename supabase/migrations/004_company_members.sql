create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_key text not null default 'employee',
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index company_members_user_idx on public.company_members(user_id, company_id);
alter table public.company_members enable row level security;
revoke all on table public.company_members from anon, authenticated;
grant select on table public.company_members to authenticated;

create or replace function private.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_members as member
    where member.company_id = target_company_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
  );
$$;

create or replace function private.has_company_role(target_company_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_members as member
    where member.company_id = target_company_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role_key = any(allowed_roles)
  );
$$;

revoke all on function private.is_company_member(uuid) from public;
revoke all on function private.has_company_role(uuid, text[]) from public;
grant usage on schema private to authenticated, service_role;
grant execute on function private.is_company_member(uuid) to authenticated, service_role;
grant execute on function private.has_company_role(uuid, text[]) to authenticated, service_role;

create policy companies_member_read
on public.companies for select
to authenticated
using ((select private.is_company_member(id)));

create policy companies_admin_update
on public.companies for update
to authenticated
using ((select private.has_company_role(id, array['owner', 'company_admin']::text[])))
with check ((select private.has_company_role(id, array['owner', 'company_admin']::text[])));

create policy company_members_member_read
on public.company_members for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_company_member(company_id))
);

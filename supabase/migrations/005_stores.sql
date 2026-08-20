create table public.stores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (length(btrim(name)) >= 2),
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create index stores_company_idx on public.stores(company_id);
alter table public.stores enable row level security;
revoke all on table public.stores from anon, authenticated;
grant select, insert, update on table public.stores to authenticated;

create policy stores_member_read
on public.stores for select
to authenticated
using ((select private.is_company_member(company_id)));

create policy stores_admin_insert
on public.stores for insert
to authenticated
with check ((select private.has_company_role(company_id, array['owner', 'company_admin']::text[])));

create policy stores_admin_update
on public.stores for update
to authenticated
using ((select private.has_company_role(company_id, array['owner', 'company_admin']::text[])))
with check ((select private.has_company_role(company_id, array['owner', 'company_admin']::text[])));

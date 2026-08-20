create table public.branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (length(btrim(name)) >= 2),
  code text not null check (length(btrim(code)) >= 1),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (store_id, code),
  unique (id, company_id)
);

create index branches_tenant_idx on public.branches(company_id, store_id);
alter table public.branches enable row level security;
revoke all on table public.branches from anon, authenticated;
grant select, insert, update on table public.branches to authenticated;

create policy branches_member_read
on public.branches for select
to authenticated
using ((select private.is_company_member(company_id)));

create policy branches_admin_insert
on public.branches for insert
to authenticated
with check (
  (select private.has_company_role(company_id, array['owner', 'company_admin']::text[]))
  and exists (
    select 1 from public.stores as store
    where store.id = branches.store_id
      and store.company_id = branches.company_id
  )
);

create policy branches_admin_update
on public.branches for update
to authenticated
using ((select private.has_company_role(company_id, array['owner', 'company_admin']::text[])))
with check (
  (select private.has_company_role(company_id, array['owner', 'company_admin']::text[]))
  and exists (
    select 1 from public.stores as store
    where store.id = branches.store_id
      and store.company_id = branches.company_id
  )
);

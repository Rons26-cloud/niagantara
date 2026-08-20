create or replace function public.provision_company(
  p_user_id uuid,
  p_company_name text,
  p_legal_name text default null,
  p_full_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  provisioned_company public.companies;
  main_store public.stores;
  main_branch public.branches;
begin
  if p_user_id is null or not exists (
    select 1 from auth.users as auth_user where auth_user.id = p_user_id
  ) then
    raise exception 'AUTH_USER_NOT_FOUND' using errcode = 'P0001';
  end if;

  if p_company_name is null or pg_catalog.length(pg_catalog.btrim(p_company_name)) < 2 then
    raise exception 'INVALID_COMPANY_NAME' using errcode = '22023';
  end if;

  insert into public.profiles (id, full_name)
  values (p_user_id, nullif(pg_catalog.btrim(p_full_name), ''))
  on conflict (id) do update
  set full_name = coalesce(excluded.full_name, public.profiles.full_name);

  select company.* into provisioned_company
  from public.companies as company
  join public.company_members as member
    on member.company_id = company.id
   and member.user_id = p_user_id
   and member.role_key = 'owner'
   and member.status = 'active'
  where company.created_by = p_user_id
    and pg_catalog.lower(company.name) = pg_catalog.lower(pg_catalog.btrim(p_company_name))
  order by company.created_at
  limit 1;

  if provisioned_company.id is null then
    insert into public.companies (name, legal_name, created_by)
    values (pg_catalog.btrim(p_company_name), nullif(pg_catalog.btrim(p_legal_name), ''), p_user_id)
    returning * into provisioned_company;

    insert into public.company_members (company_id, user_id, role_key, status)
    values (provisioned_company.id, p_user_id, 'owner', 'active');

    insert into public.stores (company_id, name)
    values (provisioned_company.id, 'Main Store')
    returning * into main_store;

    insert into public.branches (company_id, store_id, name, code)
    values (provisioned_company.id, main_store.id, 'Main Branch', 'MAIN')
    returning * into main_branch;

    insert into public.audit_logs (
      company_id, branch_id, actor_user_id, action, resource_type, resource_id, metadata
    )
    values (
      provisioned_company.id,
      main_branch.id,
      p_user_id,
      'auth.register',
      'company',
      provisioned_company.id,
      pg_catalog.jsonb_build_object('provisioned', true, 'database_atomic', true)
    );
  else
    select store.* into main_store
    from public.stores as store
    where store.company_id = provisioned_company.id
    order by store.created_at
    limit 1;

    select branch.* into main_branch
    from public.branches as branch
    where branch.company_id = provisioned_company.id
    order by branch.created_at
    limit 1;
  end if;

  return pg_catalog.jsonb_build_object(
    'company', pg_catalog.to_jsonb(provisioned_company),
    'store', pg_catalog.to_jsonb(main_store),
    'branch', pg_catalog.to_jsonb(main_branch),
    'idempotent', true
  );
end;
$$;

revoke all on function public.provision_company(uuid, text, text, text) from public;
revoke all on function public.provision_company(uuid, text, text, text) from anon, authenticated;
grant execute on function public.provision_company(uuid, text, text, text) to service_role;

comment on function public.provision_company(uuid, text, text, text) is
'Server-only RPC. Executable only by service_role. Creates/repairs the database portion of registration atomically; Supabase Auth user creation is a separate transaction boundary.';

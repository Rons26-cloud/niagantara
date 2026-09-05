-- Transactional access-management mutations.
-- These functions are server-only. Each invocation is one PostgreSQL transaction.

create or replace function public.update_company_user_access(
  target_company_id uuid,
  target_user_id uuid,
  actor_id uuid,
  target_role_key text default null,
  target_status text default null,
  branch_assignments jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_member public.company_members;
  actor_role text;
  next_role text;
  next_status text;
begin
  select cm.role_key into actor_role
  from public.company_members cm
  where cm.company_id = target_company_id
    and cm.user_id = actor_id
    and cm.status = 'active'
    and cm.role_key in ('owner', 'company_admin');
  if actor_role is null then raise exception 'PERMISSION_DENIED'; end if;

  -- A single deterministic lock serializes every owner-changing request for
  -- this company, including requests targeting different membership rows.
  perform 1 from public.companies c
  where c.id = target_company_id
  for update;
  if not found then raise exception 'MEMBERSHIP_NOT_FOUND'; end if;

  select * into target_member
  from public.company_members cm
  where cm.company_id = target_company_id and cm.user_id = target_user_id
  for update;
  if not found then raise exception 'MEMBERSHIP_NOT_FOUND'; end if;

  -- Serialize all owner-changing requests for this company.
  perform 1 from public.company_members cm
  where cm.company_id = target_company_id
    and cm.role_key = 'owner' and cm.status = 'active'
  for update;

  if target_status is not null and target_status not in ('active', 'invited', 'suspended') then
    raise exception 'INVALID_MEMBER_STATUS';
  end if;
  if target_role_key is not null and not exists (
    select 1 from public.roles r where r.scope = 'company' and r.role_key = target_role_key
  ) then raise exception 'INVALID_COMPANY_ROLE'; end if;

  next_role := coalesce(target_role_key, target_member.role_key);
  next_status := coalesce(target_status, target_member.status);
  if target_member.role_key = 'owner' and target_member.status = 'active'
     and (next_role <> 'owner' or next_status <> 'active')
     and not exists (
       select 1 from public.company_members cm
       where cm.company_id = target_company_id and cm.id <> target_member.id
         and cm.role_key = 'owner' and cm.status = 'active'
     ) then
    raise exception 'LAST_OWNER_REQUIRED';
  end if;

  if branch_assignments is not null then
    if pg_catalog.jsonb_typeof(branch_assignments) <> 'array' then
      raise exception 'INVALID_BRANCH_ASSIGNMENTS';
    end if;
    if exists (
      select 1 from (
        select b.branch_id from pg_catalog.jsonb_to_recordset(branch_assignments)
          as b(branch_id uuid, role_key text, status text)
        group by b.branch_id having count(*) > 1
      ) duplicates
    ) then raise exception 'DUPLICATE_BRANCH_ASSIGNMENT'; end if;
    if exists (
      select 1 from pg_catalog.jsonb_to_recordset(branch_assignments)
        as b(branch_id uuid, role_key text, status text)
      where b.status is not null and b.status not in ('active', 'invited', 'suspended')
    ) then raise exception 'INVALID_MEMBER_STATUS'; end if;
    if exists (
      select 1 from pg_catalog.jsonb_to_recordset(branch_assignments)
        as b(branch_id uuid, role_key text, status text)
      where not exists (
        select 1 from public.branches br
        where br.id = b.branch_id and br.company_id = target_company_id
      )
    ) then raise exception 'BRANCH_ACCESS_DENIED'; end if;
    if exists (
      select 1 from pg_catalog.jsonb_to_recordset(branch_assignments)
        as b(branch_id uuid, role_key text, status text)
      where not exists (
        select 1 from public.roles r
        where r.scope = 'branch' and r.role_key = b.role_key
      )
    ) then raise exception 'INVALID_BRANCH_ROLE'; end if;

    delete from public.branch_members
    where company_id = target_company_id and user_id = target_user_id;
    insert into public.branch_members(company_id, branch_id, user_id, role_key, status)
    select target_company_id, b.branch_id, target_user_id, b.role_key, coalesce(b.status, 'active')
    from pg_catalog.jsonb_to_recordset(branch_assignments)
      as b(branch_id uuid, role_key text, status text);
  end if;

  update public.company_members
  set role_key = coalesce(target_role_key, role_key),
      status = coalesce(target_status, status)
  where id = target_member.id;

  insert into public.audit_logs(company_id, actor_user_id, action, resource_type, resource_id, metadata)
  values (target_company_id, actor_id, 'company_user.updated', 'company_member', target_member.id,
    pg_catalog.jsonb_build_object('target_user_id', target_user_id, 'branch_replacement', branch_assignments is not null));

  return pg_catalog.jsonb_build_object('user_id', target_user_id, 'role_key', next_role, 'status', next_status);
end;
$$;

create or replace function public.provision_cashier_access(
  target_company_id uuid,
  target_user_id uuid,
  target_branch_id uuid,
  target_full_name text,
  actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.company_members cm
    where cm.company_id = target_company_id and cm.user_id = actor_id
      and cm.status = 'active' and cm.role_key in ('owner', 'company_admin')
  ) then raise exception 'PERMISSION_DENIED'; end if;
  if not exists (
    select 1 from public.branches br
    where br.id = target_branch_id and br.company_id = target_company_id and br.status = 'active'
  ) then raise exception 'BRANCH_ACCESS_DENIED'; end if;

  insert into public.profiles(id, full_name)
  values (target_user_id, nullif(pg_catalog.btrim(target_full_name), ''))
  on conflict (id) do update set full_name = excluded.full_name;
  insert into public.company_members(company_id, user_id, role_key, status)
  values (target_company_id, target_user_id, 'employee', 'active');
  insert into public.branch_members(company_id, branch_id, user_id, role_key, status)
  values (target_company_id, target_branch_id, target_user_id, 'cashier', 'active');
  insert into public.audit_logs(company_id, branch_id, actor_user_id, action, resource_type, resource_id, metadata)
  values (target_company_id, target_branch_id, actor_id, 'pos_cashier.created', 'user', target_user_id,
    pg_catalog.jsonb_build_object('branch_id', target_branch_id));
  return pg_catalog.jsonb_build_object('user_id', target_user_id, 'branch_id', target_branch_id);
end;
$$;

create or replace function public.revoke_cashier_access(
  target_company_id uuid,
  target_user_id uuid,
  actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  revoked_count integer;
begin
  if not exists (
    select 1 from public.company_members cm
    where cm.company_id = target_company_id and cm.user_id = actor_id
      and cm.status = 'active' and cm.role_key in ('owner', 'company_admin')
  ) then raise exception 'PERMISSION_DENIED'; end if;
  perform 1 from public.branch_members bm
  where bm.company_id = target_company_id and bm.user_id = target_user_id and bm.role_key = 'cashier'
  for update;
  update public.branch_members
  set status = 'suspended'
  where company_id = target_company_id and user_id = target_user_id and role_key = 'cashier';
  get diagnostics revoked_count = row_count;
  if revoked_count = 0 then raise exception 'CASHIER_NOT_FOUND'; end if;
  insert into public.audit_logs(company_id, actor_user_id, action, resource_type, resource_id, metadata)
  values (target_company_id, actor_id, 'pos_cashier.removed', 'user', target_user_id,
    pg_catalog.jsonb_build_object('revoked_count', revoked_count));
  return pg_catalog.jsonb_build_object('revoked_count', revoked_count);
end;
$$;

revoke all on function public.update_company_user_access(uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.provision_cashier_access(uuid, uuid, uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.revoke_cashier_access(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.update_company_user_access(uuid, uuid, uuid, text, text, jsonb) to service_role;
grant execute on function public.provision_cashier_access(uuid, uuid, uuid, text, uuid) to service_role;
grant execute on function public.revoke_cashier_access(uuid, uuid, uuid) to service_role;

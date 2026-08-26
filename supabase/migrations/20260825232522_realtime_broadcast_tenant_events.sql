-- Tenant-scoped Realtime Broadcast notifications. Payloads are identifiers only;
-- API responses remain the authoritative source for business data.

create or replace function private.broadcast_business_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  company_id text := row_data->>'company_id';
  branch_id text := row_data->>'branch_id';
  entity_id text := row_data->>'id';
  action text := lower(tg_op);
  event_name text := case tg_table_name
    when 'sales' then case when row_data->>'status' = 'CANCELLED' then 'sale.cancelled' else 'sale.' || action end
    when 'inventory' then 'inventory.updated'
    when 'inventory_movements' then 'inventory.updated'
    when 'purchases' then case
      when tg_op = 'DELETE' then 'purchase.deleted'
      when row_data->>'status' in ('RECEIVED', 'PARTIALLY_RECEIVED') then 'purchase.received'
      when tg_op = 'INSERT' then 'purchase.created'
      else 'purchase.updated'
    end
    when 'expenses' then 'expense.' || case when tg_op = 'INSERT' then 'created' else 'updated' end
    when 'payments' then 'payment.recorded'
    when 'attendance_records' then 'attendance.updated'
    when 'products' then 'catalog.updated'
    when 'categories' then 'catalog.updated'
    when 'barcodes' then 'catalog.updated'
    when 'customers' then 'customer.updated'
    when 'suppliers' then 'supplier.updated'
    when 'stores' then 'organization.updated'
    when 'branches' then 'organization.updated'
    when 'warehouses' then 'organization.updated'
    when 'cashier_shifts' then 'shift.updated'
    when 'employees' then 'team.updated'
    when 'employee_branch_assignments' then 'team.updated'
    when 'employee_work_shifts' then 'team.updated'
    when 'company_members' then 'team.updated'
    when 'branch_members' then 'team.updated'
    when 'google_connections' then 'sheet.updated'
    when 'sheet_workbooks' then 'sheet.updated'
    when 'sheet_definitions' then 'sheet.updated'
    when 'sheet_columns' then 'sheet.updated'
    when 'sheet_sync_history' then 'sheet.updated'
    else lower(tg_table_name) || '.updated'
  end;
  payload jsonb := jsonb_build_object(
    'entity', tg_table_name,
    'action', action,
    'id', entity_id,
    'company_id', company_id,
    'branch_id', nullif(branch_id, ''),
    'occurred_at', now()
  );
begin
  if company_id is null then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  perform realtime.send(payload, event_name, 'company:' || company_id || ':dashboard', true);
  if branch_id is not null and branch_id <> '' then
    perform realtime.send(payload, event_name, 'branch:' || branch_id || ':dashboard', true);
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

revoke all on function private.broadcast_business_change() from public, anon, authenticated;

drop trigger if exists sales_realtime_broadcast on public.sales;
create trigger sales_realtime_broadcast
after insert or update or delete on public.sales
for each row execute function private.broadcast_business_change();

drop trigger if exists inventory_realtime_broadcast on public.inventory;
create trigger inventory_realtime_broadcast
after insert or update or delete on public.inventory
for each row execute function private.broadcast_business_change();

drop trigger if exists inventory_movements_realtime_broadcast on public.inventory_movements;
create trigger inventory_movements_realtime_broadcast
after insert or update or delete on public.inventory_movements
for each row execute function private.broadcast_business_change();

drop trigger if exists purchases_realtime_broadcast on public.purchases;
create trigger purchases_realtime_broadcast
after insert or update or delete on public.purchases
for each row execute function private.broadcast_business_change();

drop trigger if exists expenses_realtime_broadcast on public.expenses;
create trigger expenses_realtime_broadcast
after insert or update or delete on public.expenses
for each row execute function private.broadcast_business_change();

drop trigger if exists payments_realtime_broadcast on public.payments;
create trigger payments_realtime_broadcast
after insert or update or delete on public.payments
for each row execute function private.broadcast_business_change();

drop trigger if exists attendance_realtime_broadcast on public.attendance_records;
create trigger attendance_realtime_broadcast
after insert or update or delete on public.attendance_records
for each row execute function private.broadcast_business_change();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'products', 'categories', 'barcodes', 'customers', 'suppliers',
    'stores', 'branches', 'warehouses', 'cashier_shifts', 'employees',
    'employee_branch_assignments', 'employee_work_shifts',
    'company_members', 'branch_members', 'google_connections',
    'sheet_workbooks', 'sheet_definitions', 'sheet_columns',
    'sheet_sync_history'
  ] loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_realtime_broadcast', table_name);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.broadcast_business_change()',
      table_name || '_realtime_broadcast',
      table_name
    );
  end loop;
end;
$$;

drop policy if exists realtime_company_dashboard_read on realtime.messages;
create policy realtime_company_dashboard_read
on realtime.messages
for select
to authenticated
using (
  extension = 'broadcast'
  and realtime.topic() ~* '^company:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}:dashboard$'
  and exists (
    select 1
    from public.company_members cm
    where cm.company_id = split_part(realtime.topic(), ':', 2)::uuid
      and cm.user_id = (select auth.uid())
      and cm.status = 'active'
      and cm.role_key in ('owner', 'company_admin', 'finance', 'accountant', 'hr')
  )
);

drop policy if exists realtime_branch_dashboard_read on realtime.messages;
create policy realtime_branch_dashboard_read
on realtime.messages
for select
to authenticated
using (
  extension = 'broadcast'
  and realtime.topic() ~* '^branch:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}:dashboard$'
  and (
    exists (
      select 1
      from public.branch_members bm
      where bm.branch_id = split_part(realtime.topic(), ':', 2)::uuid
        and bm.user_id = (select auth.uid())
        and bm.status = 'active'
    )
    or exists (
      select 1
      from public.company_members cm
      join public.branches b on b.company_id = cm.company_id
      where b.id = split_part(realtime.topic(), ':', 2)::uuid
        and cm.user_id = (select auth.uid())
        and cm.status = 'active'
        and cm.role_key in ('owner', 'company_admin')
    )
  )
);

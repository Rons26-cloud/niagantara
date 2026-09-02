-- Security hardening:
-- 1. Make public.adjust_inventory / public.transfer_inventory guards NULL-safe.
--    Previous guards used `(select auth.role())<>'service_role'` which evaluates
--    to NULL (and lets the check pass) when the JWT role claim is absent, so a
--    raw DB connection without request.jwt.claim.role could reach SECURITY
--    DEFINER inventory writes. Now the auth context must be explicit.
-- 2. Restrict both inventory RPCs to service_role only, matching the trust
--    model used by every other write RPC (pos, finance, sheets).
-- 3. Enforce FORCE ROW LEVEL SECURITY on all tables so RLS cannot later be
--    silently bypassed through a table-owner connection.

create or replace function public.adjust_inventory(target_company_id uuid,target_branch_id uuid,target_warehouse_id uuid,target_product_id uuid,quantity_delta numeric,target_minimum_stock numeric,movement_kind text,actor_id uuid,movement_notes text default null,target_reference_type text default null,target_reference_id uuid default null)
returns public.inventory language plpgsql security definer set search_path='' as $$
declare stock public.inventory; wh public.warehouses;
begin
 if actor_id is null then raise exception 'ACTOR_REQUIRED'; end if;
 if (select coalesce(auth.role(),''))<>'service_role' then
  if (select auth.uid()) is null or actor_id<>(select auth.uid()) then raise exception 'ACTOR_MISMATCH'; end if;
  if not (select private.has_phase2_permission(target_company_id,target_branch_id,'inventory.adjust')) then raise exception 'PERMISSION_DENIED'; end if;
 end if;
 if quantity_delta=0 or movement_kind not in ('STOCK_IN','STOCK_OUT','ADJUSTMENT','SALE','PURCHASE','RETURN','DAMAGED') then raise exception 'INVALID_MOVEMENT'; end if;
 select * into wh from public.warehouses where id=target_warehouse_id and company_id=target_company_id and branch_id=target_branch_id and status='active';
 if not found then raise exception 'WAREHOUSE_RELATION_INVALID'; end if;
 if not exists(select 1 from public.products where id=target_product_id and company_id=target_company_id and status<>'archived') then raise exception 'PRODUCT_RELATION_INVALID'; end if;
 insert into public.inventory(company_id,branch_id,warehouse_id,product_id,quantity,minimum_stock) values(target_company_id,target_branch_id,target_warehouse_id,target_product_id,0,coalesce(target_minimum_stock,0)) on conflict(warehouse_id,product_id) do nothing;
 select * into stock from public.inventory where warehouse_id=target_warehouse_id and product_id=target_product_id for update;
 if stock.company_id<>target_company_id or stock.branch_id<>target_branch_id then raise exception 'INVENTORY_RELATION_INVALID'; end if;
 if stock.quantity+quantity_delta<0 then raise exception 'NEGATIVE_STOCK'; end if;
 update public.inventory set quantity=quantity+quantity_delta,minimum_stock=coalesce(target_minimum_stock,minimum_stock),updated_at=now() where id=stock.id returning * into stock;
 insert into public.inventory_movements(company_id,branch_id,warehouse_id,product_id,movement_type,quantity,balance_after,reference_type,reference_id,actor_user_id,notes) values(target_company_id,target_branch_id,target_warehouse_id,target_product_id,movement_kind,quantity_delta,stock.quantity,target_reference_type,target_reference_id,actor_id,movement_notes);
 return stock;
end; $$;

create or replace function public.transfer_inventory(target_company_id uuid,source_warehouse_id uuid,destination_warehouse_id uuid,target_product_id uuid,transfer_quantity numeric,actor_id uuid,transfer_notes text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare src public.inventory; dst public.inventory; src_wh public.warehouses; dst_wh public.warehouses; transfer_id uuid:=gen_random_uuid();
begin
 if source_warehouse_id=destination_warehouse_id or transfer_quantity<=0 then raise exception 'INVALID_TRANSFER'; end if;
 if actor_id is null then raise exception 'ACTOR_REQUIRED'; end if;
 select * into src_wh from public.warehouses where id=source_warehouse_id and company_id=target_company_id and status='active';
 select * into dst_wh from public.warehouses where id=destination_warehouse_id and company_id=target_company_id and status='active';
 if src_wh.id is null or dst_wh.id is null then raise exception 'WAREHOUSE_RELATION_INVALID'; end if;
 if (select coalesce(auth.role(),''))<>'service_role' then
  if (select auth.uid()) is null or actor_id<>(select auth.uid()) then raise exception 'ACTOR_MISMATCH'; end if;
  if (not (select private.has_phase2_permission(target_company_id,src_wh.branch_id,'inventory.transfer')) or not (select private.has_phase2_permission(target_company_id,dst_wh.branch_id,'inventory.transfer'))) then raise exception 'PERMISSION_DENIED'; end if;
 end if;
 if not exists(select 1 from public.products where id=target_product_id and company_id=target_company_id and status<>'archived') then raise exception 'PRODUCT_RELATION_INVALID'; end if;
 insert into public.inventory(company_id,branch_id,warehouse_id,product_id,quantity) values(target_company_id,dst_wh.branch_id,destination_warehouse_id,target_product_id,0) on conflict(warehouse_id,product_id) do nothing;
 perform id from public.inventory where warehouse_id in(source_warehouse_id,destination_warehouse_id) and product_id=target_product_id order by warehouse_id for update;
 select * into src from public.inventory where warehouse_id=source_warehouse_id and product_id=target_product_id;
 select * into dst from public.inventory where warehouse_id=destination_warehouse_id and product_id=target_product_id;
 if src.id is null or src.quantity<transfer_quantity then raise exception 'INSUFFICIENT_STOCK'; end if;
 update public.inventory set quantity=quantity-transfer_quantity,updated_at=now() where id=src.id returning * into src;
 update public.inventory set quantity=quantity+transfer_quantity,updated_at=now() where id=dst.id returning * into dst;
 insert into public.inventory_movements(company_id,branch_id,warehouse_id,product_id,movement_type,quantity,balance_after,reference_type,reference_id,actor_user_id,notes) values
 (target_company_id,src_wh.branch_id,source_warehouse_id,target_product_id,'TRANSFER_OUT',-transfer_quantity,src.quantity,'stock_transfer',transfer_id,actor_id,transfer_notes),
 (target_company_id,dst_wh.branch_id,destination_warehouse_id,target_product_id,'TRANSFER_IN',transfer_quantity,dst.quantity,'stock_transfer',transfer_id,actor_id,transfer_notes);
 return transfer_id;
end; $$;

-- Inventory adjustments/transfers are write paths owned by the API. Revoke the
-- browser-facing role; keep service_role only, consistent with checkout_sale etc.
revoke all on function public.adjust_inventory(uuid,uuid,uuid,uuid,numeric,numeric,text,uuid,text,text,uuid) from public,anon,authenticated;
revoke all on function public.transfer_inventory(uuid,uuid,uuid,uuid,numeric,uuid,text) from public,anon,authenticated;
grant execute on function public.adjust_inventory(uuid,uuid,uuid,uuid,numeric,numeric,text,uuid,text,text,uuid) to service_role;
grant execute on function public.transfer_inventory(uuid,uuid,uuid,uuid,numeric,uuid,text) to service_role;

-- Force RLS on every tenant table so an owner-role connection cannot bypass it.
alter table public.attendance_records force row level security;
alter table public.audit_logs force row level security;
alter table public.barcodes force row level security;
alter table public.branch_members force row level security;
alter table public.branches force row level security;
alter table public.cashier_shifts force row level security;
alter table public.categories force row level security;
alter table public.companies force row level security;
alter table public.company_members force row level security;
alter table public.customers force row level security;
alter table public.employee_branch_assignments force row level security;
alter table public.employee_work_shifts force row level security;
alter table public.employees force row level security;
alter table public.expense_categories force row level security;
alter table public.expenses force row level security;
alter table public.financial_transactions force row level security;
alter table public.google_connections force row level security;
alter table public.google_oauth_states force row level security;
alter table public.inventory force row level security;
alter table public.inventory_movements force row level security;
alter table public.payables force row level security;
alter table public.payments force row level security;
alter table public.permissions force row level security;
alter table public.products force row level security;
alter table public.profiles force row level security;
alter table public.purchase_items force row level security;
alter table public.purchase_number_counters force row level security;
alter table public.purchase_receipt_items force row level security;
alter table public.purchase_receipts force row level security;
alter table public.purchase_status_history force row level security;
alter table public.purchases force row level security;
alter table public.receivables force row level security;
alter table public.refund_items force row level security;
alter table public.refunds force row level security;
alter table public.role_permissions force row level security;
alter table public.roles force row level security;
alter table public.sale_items force row level security;
alter table public.sale_number_counters force row level security;
alter table public.sale_status_history force row level security;
alter table public.sales force row level security;
alter table public.security_events force row level security;
alter table public.sheet_columns force row level security;
alter table public.sheet_definitions force row level security;
alter table public.sheet_sync_history force row level security;
alter table public.sheet_sync_queue force row level security;
alter table public.sheet_workbooks force row level security;
alter table public.stores force row level security;
alter table public.suppliers force row level security;
alter table public.warehouses force row level security;
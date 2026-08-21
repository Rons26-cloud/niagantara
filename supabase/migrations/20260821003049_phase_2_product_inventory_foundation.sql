-- NIAGANTARA Phase 2 product and inventory foundation.
-- Catalog is company-scoped; stock is authoritative per warehouse.

alter table public.stores add column status text not null default 'active' check (status in ('active', 'inactive')), add column updated_at timestamptz not null default now();
alter table public.branches add column is_main boolean not null default false, add column updated_at timestamptz not null default now();
alter table public.stores add constraint stores_id_company_unique unique(id,company_id);
alter table public.branches add constraint branches_id_company_store_unique unique(id,company_id,store_id);
create unique index branches_one_main_per_store_idx on public.branches(store_id) where is_main;

create table public.branch_members (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid not null, user_id uuid not null references public.profiles(id) on delete cascade,
  role_key text not null default 'employee', status text not null default 'active' check (status in ('active','invited','suspended')),
  created_at timestamptz not null default now(), unique (branch_id,user_id),
  foreign key (branch_id,company_id) references public.branches(id,company_id) on delete cascade
);
create index branch_members_user_scope_idx on public.branch_members(user_id,company_id,branch_id) where status='active';
create index branch_members_company_idx on public.branch_members(company_id,branch_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 120), description text,
  status text not null default 'active' check (status in ('active','archived')),
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (company_id,name), unique (id,company_id)
);
create index categories_company_status_idx on public.categories(company_id,status,name);
create index categories_created_by_idx on public.categories(created_by);

create table public.products (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 180), sku text not null check (length(btrim(sku)) between 1 and 80),
  category_id uuid, description text, cost_price numeric(18,2) not null default 0 check (cost_price>=0),
  selling_price numeric(18,2) not null default 0 check (selling_price>=0),
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (company_id,sku), unique (id,company_id), foreign key (category_id,company_id) references public.categories(id,company_id)
);
create index products_company_status_created_idx on public.products(company_id,status,created_at desc,id desc);
create index products_company_name_idx on public.products(company_id,lower(name));
create index products_category_idx on public.products(category_id) where category_id is not null;
create index products_created_by_idx on public.products(created_by);

create table public.barcodes (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null, code text not null check (length(btrim(code)) between 4 and 80),
  source text not null check (source in ('manufacturer','internal','manual')), is_primary boolean not null default false,
  active boolean not null default true, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), retired_at timestamptz,
  unique (code), foreign key (product_id,company_id) references public.products(id,company_id) on delete cascade
);
create index barcodes_product_idx on public.barcodes(product_id,active);
create index barcodes_company_code_idx on public.barcodes(company_id,code);
create unique index barcodes_one_primary_per_product_idx on public.barcodes(product_id) where is_primary and active;
create index barcodes_created_by_idx on public.barcodes(created_by);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  store_id uuid not null references public.stores(id), branch_id uuid not null,
  name text not null check (length(btrim(name)) between 2 and 120), code text not null check (length(btrim(code)) between 1 and 40),
  is_main boolean not null default false, status text not null default 'active' check (status in ('active','inactive')),
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (company_id,code), unique (id,company_id),
  foreign key (store_id,company_id) references public.stores(id,company_id),
  foreign key (branch_id,company_id,store_id) references public.branches(id,company_id,store_id)
);
create index warehouses_scope_idx on public.warehouses(company_id,branch_id,status);
create index warehouses_store_idx on public.warehouses(store_id);
create index warehouses_created_by_idx on public.warehouses(created_by);
create unique index warehouses_one_main_per_branch_idx on public.warehouses(branch_id) where is_main;

create table public.inventory (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid not null, warehouse_id uuid not null, product_id uuid not null,
  quantity numeric(18,3) not null default 0 check (quantity>=0), minimum_stock numeric(18,3) not null default 0 check (minimum_stock>=0),
  updated_at timestamptz not null default now(), unique (warehouse_id,product_id), unique (id,company_id),
  foreign key (branch_id,company_id) references public.branches(id,company_id),
  foreign key (warehouse_id,company_id) references public.warehouses(id,company_id),
  foreign key (product_id,company_id) references public.products(id,company_id)
);
create index inventory_low_stock_idx on public.inventory(company_id,branch_id,quantity,minimum_stock);
create index inventory_product_idx on public.inventory(product_id,branch_id);
create index inventory_warehouse_idx on public.inventory(warehouse_id);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid not null, warehouse_id uuid not null, product_id uuid not null,
  movement_type text not null check (movement_type in ('STOCK_IN','STOCK_OUT','ADJUSTMENT','TRANSFER_IN','TRANSFER_OUT','SALE','PURCHASE','RETURN','DAMAGED')),
  quantity numeric(18,3) not null check (quantity<>0), balance_after numeric(18,3) not null check (balance_after>=0),
  reference_type text, reference_id uuid, actor_user_id uuid not null references public.profiles(id), notes text, created_at timestamptz not null default now(),
  foreign key (branch_id,company_id) references public.branches(id,company_id),
  foreign key (warehouse_id,company_id) references public.warehouses(id,company_id),
  foreign key (product_id,company_id) references public.products(id,company_id)
);
create index movements_scope_created_idx on public.inventory_movements(company_id,branch_id,created_at desc,id desc);
create index movements_product_created_idx on public.inventory_movements(product_id,created_at desc);
create index movements_warehouse_created_idx on public.inventory_movements(warehouse_id,created_at desc);
create index movements_actor_idx on public.inventory_movements(actor_user_id);
create index movements_reference_idx on public.inventory_movements(reference_type,reference_id) where reference_id is not null;

create or replace function private.has_branch_access(target_company_id uuid,target_branch_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.company_members cm where cm.company_id=target_company_id and cm.user_id=(select auth.uid()) and cm.status='active' and cm.role_key in ('owner','company_admin'))
 or exists(select 1 from public.branch_members bm where bm.company_id=target_company_id and bm.branch_id=target_branch_id and bm.user_id=(select auth.uid()) and bm.status='active');
$$;
create or replace function private.has_phase2_permission(target_company_id uuid,target_branch_id uuid,target_permission text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.company_members cm join public.roles r on r.scope='company' and r.role_key=cm.role_key join public.role_permissions rp on rp.role_id=r.id join public.permissions p on p.id=rp.permission_id where cm.company_id=target_company_id and cm.user_id=(select auth.uid()) and cm.status='active' and p.permission_key=target_permission)
 or exists(select 1 from public.branch_members bm join public.roles r on r.scope='branch' and r.role_key=bm.role_key join public.role_permissions rp on rp.role_id=r.id join public.permissions p on p.id=rp.permission_id where bm.company_id=target_company_id and (target_branch_id is null or bm.branch_id=target_branch_id) and bm.user_id=(select auth.uid()) and bm.status='active' and p.permission_key=target_permission);
$$;
revoke all on function private.has_branch_access(uuid,uuid) from public;
revoke all on function private.has_phase2_permission(uuid,uuid,text) from public;
grant execute on function private.has_branch_access(uuid,uuid) to authenticated,service_role;
grant execute on function private.has_phase2_permission(uuid,uuid,text) to authenticated,service_role;

alter table public.branch_members enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.barcodes enable row level security;
alter table public.warehouses enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
revoke all on table public.branch_members,public.categories,public.products,public.barcodes,public.warehouses,public.inventory,public.inventory_movements from anon,authenticated;
grant select on table public.branch_members to authenticated;
grant select,insert,update on table public.categories,public.products,public.barcodes,public.warehouses to authenticated;
grant select on table public.inventory,public.inventory_movements to authenticated;

create policy branch_members_scoped_read on public.branch_members for select to authenticated using ((select private.has_branch_access(company_id,branch_id)));
create policy categories_read on public.categories for select to authenticated using ((select private.has_phase2_permission(company_id,null,'category.read')));
create policy categories_insert on public.categories for insert to authenticated with check (created_by=(select auth.uid()) and (select private.has_phase2_permission(company_id,null,'category.manage')));
create policy categories_update on public.categories for update to authenticated using ((select private.has_phase2_permission(company_id,null,'category.manage'))) with check ((select private.has_phase2_permission(company_id,null,'category.manage')));
create policy products_read on public.products for select to authenticated using ((select private.has_phase2_permission(company_id,null,'product.read')));
create policy products_insert on public.products for insert to authenticated with check (created_by=(select auth.uid()) and (select private.has_phase2_permission(company_id,null,'product.create')));
create policy products_update on public.products for update to authenticated using ((select private.has_phase2_permission(company_id,null,'product.update'))) with check ((select private.has_phase2_permission(company_id,null,'product.update')));
create policy barcodes_read on public.barcodes for select to authenticated using ((select private.has_phase2_permission(company_id,null,'barcode.read')));
create policy barcodes_insert on public.barcodes for insert to authenticated with check (created_by=(select auth.uid()) and (select private.has_phase2_permission(company_id,null,'barcode.generate')));
create policy barcodes_update on public.barcodes for update to authenticated using ((select private.has_phase2_permission(company_id,null,'barcode.generate'))) with check ((select private.has_phase2_permission(company_id,null,'barcode.generate')));
create policy warehouses_read on public.warehouses for select to authenticated using ((select private.has_phase2_permission(company_id,branch_id,'warehouse.read')));
create policy warehouses_insert on public.warehouses for insert to authenticated with check (created_by=(select auth.uid()) and (select private.has_phase2_permission(company_id,branch_id,'warehouse.manage')));
create policy warehouses_update on public.warehouses for update to authenticated using ((select private.has_phase2_permission(company_id,branch_id,'warehouse.manage'))) with check ((select private.has_phase2_permission(company_id,branch_id,'warehouse.manage')));
create policy inventory_read on public.inventory for select to authenticated using ((select private.has_phase2_permission(company_id,branch_id,'inventory.read')));
create policy movements_read on public.inventory_movements for select to authenticated using ((select private.has_phase2_permission(company_id,branch_id,'inventory.read')));

create or replace function public.adjust_inventory(target_company_id uuid,target_branch_id uuid,target_warehouse_id uuid,target_product_id uuid,quantity_delta numeric,target_minimum_stock numeric,movement_kind text,actor_id uuid,movement_notes text default null,target_reference_type text default null,target_reference_id uuid default null)
returns public.inventory language plpgsql security definer set search_path='' as $$
declare stock public.inventory; wh public.warehouses;
begin
 if actor_id is null or ((select auth.uid()) is not null and actor_id<>(select auth.uid())) then raise exception 'ACTOR_MISMATCH'; end if;
 if quantity_delta=0 or movement_kind not in ('STOCK_IN','STOCK_OUT','ADJUSTMENT','SALE','PURCHASE','RETURN','DAMAGED') then raise exception 'INVALID_MOVEMENT'; end if;
 if (select auth.role())<>'service_role' and not (select private.has_phase2_permission(target_company_id,target_branch_id,'inventory.adjust')) then raise exception 'PERMISSION_DENIED'; end if;
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
 if actor_id is null or ((select auth.uid()) is not null and actor_id<>(select auth.uid())) then raise exception 'ACTOR_MISMATCH'; end if;
 select * into src_wh from public.warehouses where id=source_warehouse_id and company_id=target_company_id and status='active';
 select * into dst_wh from public.warehouses where id=destination_warehouse_id and company_id=target_company_id and status='active';
 if src_wh.id is null or dst_wh.id is null then raise exception 'WAREHOUSE_RELATION_INVALID'; end if;
 if (select auth.role())<>'service_role' and (not (select private.has_phase2_permission(target_company_id,src_wh.branch_id,'inventory.transfer')) or not (select private.has_phase2_permission(target_company_id,dst_wh.branch_id,'inventory.transfer'))) then raise exception 'PERMISSION_DENIED'; end if;
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

revoke all on function public.adjust_inventory(uuid,uuid,uuid,uuid,numeric,numeric,text,uuid,text,text,uuid) from public,anon;
revoke all on function public.transfer_inventory(uuid,uuid,uuid,uuid,numeric,uuid,text) from public,anon;
grant execute on function public.adjust_inventory(uuid,uuid,uuid,uuid,numeric,numeric,text,uuid,text,text,uuid) to authenticated,service_role;
grant execute on function public.transfer_inventory(uuid,uuid,uuid,uuid,numeric,uuid,text) to authenticated,service_role;

insert into public.permissions(permission_key,display_name) values ('category.read','Read categories'),('category.manage','Manage categories'),('barcode.read','Read barcodes'),('barcode.generate','Generate barcodes'),('warehouse.read','Read warehouses'),('warehouse.manage','Manage warehouses') on conflict(permission_key) do update set display_name=excluded.display_name;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r cross join public.permissions p where r.scope='company' and r.role_key='owner' and p.permission_key in('category.read','category.manage','barcode.read','barcode.generate','warehouse.read','warehouse.manage') on conflict do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.permission_key in('product.read','product.create','product.update','category.read','category.manage','barcode.read','barcode.generate','inventory.read','inventory.adjust','inventory.transfer','warehouse.read','warehouse.manage') where r.scope='company' and r.role_key='company_admin' on conflict do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.permission_key in('product.read','category.read','barcode.read','inventory.read','inventory.adjust','inventory.transfer','warehouse.read','warehouse.manage','branch.read') where r.scope='branch' and r.role_key in('manager','warehouse') on conflict do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.permission_key in('product.read','category.read','barcode.read','inventory.read','warehouse.read') where r.scope='branch' and r.role_key in('supervisor','cashier','employee') on conflict do nothing;

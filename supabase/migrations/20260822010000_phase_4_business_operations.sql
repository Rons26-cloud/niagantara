-- NIAGANTARA Phase 4 business operations and basic finance foundation.
-- Server-only atomic writes; authenticated clients receive permission-scoped reads.

create table public.suppliers(
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete restrict,
 supplier_code text not null,name text not null,contact_person text,phone text,email text,address text,notes text,
 status text not null default 'active' check(status in('active','inactive')),created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(company_id,supplier_code),unique(id,company_id));
create index suppliers_scope_idx on public.suppliers(company_id,status,name,id);
create table public.customers(
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete restrict,
 customer_code text not null,name text not null,phone text,email text,address text,notes text,
 status text not null default 'active' check(status in('active','inactive')),created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(company_id,customer_code),unique(id,company_id));
create index customers_scope_idx on public.customers(company_id,status,name,id);
alter table public.sales add column customer_id uuid;
alter table public.sales add constraint sales_customer_company_fkey foreign key(customer_id,company_id) references public.customers(id,company_id) on delete restrict;
create index sales_customer_idx on public.sales(company_id,customer_id,created_at desc) where customer_id is not null;

create table public.employees(
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete restrict,
 employee_code text not null,user_id uuid references public.profiles(id) on delete set null,name text not null,phone text,email text,job_title text,
 employment_status text not null default 'active' check(employment_status in('active','inactive','terminated')),hire_date date,primary_branch_id uuid,
 created_by uuid not null references public.profiles(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(company_id,employee_code),unique(company_id,user_id),unique(id,company_id),
 foreign key(primary_branch_id,company_id) references public.branches(id,company_id) on delete restrict);
create index employees_scope_idx on public.employees(company_id,employment_status,name,id);
create table public.employee_branch_assignments(
 id uuid primary key default gen_random_uuid(),company_id uuid not null,employee_id uuid not null,branch_id uuid not null,is_primary boolean not null default false,
 status text not null default 'active' check(status in('active','inactive')),assigned_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(employee_id,branch_id),unique(id,company_id),
 foreign key(employee_id,company_id) references public.employees(id,company_id) on delete cascade,
 foreign key(branch_id,company_id) references public.branches(id,company_id) on delete restrict);
create unique index employee_one_primary_branch_idx on public.employee_branch_assignments(employee_id) where is_primary and status='active';
create index employee_assignments_scope_idx on public.employee_branch_assignments(company_id,branch_id,status,employee_id);
create table public.employee_work_shifts(
 id uuid primary key default gen_random_uuid(),company_id uuid not null,employee_id uuid not null,branch_id uuid not null,
 scheduled_start timestamptz not null,scheduled_end timestamptz not null,status text not null default 'SCHEDULED' check(status in('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED')),
 notes text,created_by uuid not null references public.profiles(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(id,company_id),check(scheduled_end>scheduled_start),foreign key(employee_id,company_id) references public.employees(id,company_id) on delete restrict,
 foreign key(branch_id,company_id) references public.branches(id,company_id) on delete restrict);
create index employee_work_shifts_scope_idx on public.employee_work_shifts(company_id,branch_id,scheduled_start,employee_id);
create table public.attendance_records(
 id uuid primary key default gen_random_uuid(),company_id uuid not null,employee_id uuid not null,branch_id uuid not null,
 work_shift_id uuid references public.employee_work_shifts(id) on delete set null,attendance_date date not null,clock_in_at timestamptz not null,clock_out_at timestamptz,
 status text not null default 'PRESENT' check(status in('PRESENT','LATE','EXCUSED')),notes text,clocked_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,company_id),check(clock_out_at is null or clock_out_at>=clock_in_at),
 foreign key(employee_id,company_id) references public.employees(id,company_id) on delete restrict,
 foreign key(branch_id,company_id) references public.branches(id,company_id) on delete restrict);
create unique index attendance_one_open_idx on public.attendance_records(employee_id) where clock_out_at is null;
create index attendance_scope_idx on public.attendance_records(company_id,branch_id,attendance_date desc,employee_id);

create table public.expense_categories(
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete restrict,name text not null,description text,
 status text not null default 'active' check(status in('active','inactive')),created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(company_id,name),unique(id,company_id));
create table public.expenses(
 id uuid primary key default gen_random_uuid(),company_id uuid not null,store_id uuid,branch_id uuid,category_id uuid not null,
 amount numeric(18,3) not null check(amount>0),expense_date date not null,description text not null,payment_method text not null,reference text,
 idempotency_key text not null,status text not null default 'RECORDED' check(status in('RECORDED','VOIDED')),void_reason text,
 voided_by uuid references public.profiles(id),voided_at timestamptz,created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(company_id,idempotency_key),unique(id,company_id),
 foreign key(company_id) references public.companies(id) on delete restrict,foreign key(store_id,company_id) references public.stores(id,company_id),
 foreign key(branch_id,company_id) references public.branches(id,company_id),foreign key(category_id,company_id) references public.expense_categories(id,company_id));
create index expenses_scope_idx on public.expenses(company_id,branch_id,expense_date desc,id desc);
create index expenses_category_idx on public.expenses(company_id,category_id,expense_date desc);

create table public.purchases(
 id uuid primary key default gen_random_uuid(),company_id uuid not null,store_id uuid not null,branch_id uuid not null,warehouse_id uuid not null,supplier_id uuid not null,
 purchase_number text not null,purchase_date date not null,status text not null default 'ORDERED' check(status in('DRAFT','ORDERED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED')),
 payment_status text not null default 'UNPAID' check(payment_status in('UNPAID','PARTIALLY_PAID','PAID','CANCELLED')),
 subtotal numeric(18,3) not null default 0 check(subtotal>=0),discount numeric(18,3) not null default 0 check(discount>=0),
 tax numeric(18,3) not null default 0 check(tax>=0),grand_total numeric(18,3) not null default 0 check(grand_total>=0),notes text,
 cancellation_reason text,cancelled_by uuid references public.profiles(id),cancelled_at timestamptz,created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(company_id,purchase_number),unique(id,company_id),
 foreign key(company_id) references public.companies(id),foreign key(store_id,company_id) references public.stores(id,company_id),
 foreign key(branch_id,company_id,store_id) references public.branches(id,company_id,store_id),
 foreign key(warehouse_id,company_id) references public.warehouses(id,company_id),
 foreign key(supplier_id,company_id) references public.suppliers(id,company_id));
create index purchases_scope_idx on public.purchases(company_id,branch_id,purchase_date desc,id desc);
create index purchases_supplier_idx on public.purchases(company_id,supplier_id,purchase_date desc);
create table public.purchase_items(
 id uuid primary key default gen_random_uuid(),company_id uuid not null,purchase_id uuid not null,product_id uuid not null,
 quantity numeric(18,3) not null check(quantity>0),received_quantity numeric(18,3) not null default 0 check(received_quantity>=0 and received_quantity<=quantity),
 unit_cost numeric(18,3) not null check(unit_cost>=0),line_total numeric(18,3) not null check(line_total>=0),created_at timestamptz not null default now(),
 unique(purchase_id,product_id),unique(id,company_id),foreign key(purchase_id,company_id) references public.purchases(id,company_id) on delete cascade,
 foreign key(product_id,company_id) references public.products(id,company_id));
create index purchase_items_product_idx on public.purchase_items(company_id,product_id);
create table public.purchase_status_history(
 id uuid primary key default gen_random_uuid(),company_id uuid not null,purchase_id uuid not null,from_status text,to_status text not null,reason text,
 actor_user_id uuid not null references public.profiles(id),created_at timestamptz not null default now(),
 foreign key(purchase_id,company_id) references public.purchases(id,company_id) on delete cascade);
create index purchase_history_idx on public.purchase_status_history(company_id,purchase_id,created_at);
create table public.purchase_receipts(
 id uuid primary key default gen_random_uuid(),company_id uuid not null,purchase_id uuid not null,idempotency_key text not null,
 received_by uuid not null references public.profiles(id),notes text,created_at timestamptz not null default now(),
 unique(company_id,idempotency_key),unique(id,company_id),foreign key(purchase_id,company_id) references public.purchases(id,company_id));
create table public.purchase_receipt_items(
 id uuid primary key default gen_random_uuid(),company_id uuid not null,receipt_id uuid not null,purchase_item_id uuid not null,
 quantity numeric(18,3) not null check(quantity>0),created_at timestamptz not null default now(),unique(receipt_id,purchase_item_id),
 foreign key(receipt_id,company_id) references public.purchase_receipts(id,company_id) on delete cascade,
 foreign key(purchase_item_id,company_id) references public.purchase_items(id,company_id));
create index receipt_items_purchase_item_idx on public.purchase_receipt_items(company_id,purchase_item_id);
create table public.purchase_number_counters(company_id uuid not null,branch_id uuid not null,business_date date not null,last_number bigint not null default 0,
 primary key(company_id,branch_id,business_date),foreign key(branch_id,company_id) references public.branches(id,company_id));

create table public.payables(
 id uuid primary key default gen_random_uuid(),company_id uuid not null,supplier_id uuid not null,purchase_id uuid,
 original_amount numeric(18,3) not null check(original_amount>0),paid_amount numeric(18,3) not null default 0 check(paid_amount>=0),
 remaining_amount numeric(18,3) not null check(remaining_amount>=0),due_date date,status text not null default 'OPEN' check(status in('OPEN','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,company_id),unique(company_id,purchase_id),
 foreign key(company_id) references public.companies(id),foreign key(supplier_id,company_id) references public.suppliers(id,company_id),
 foreign key(purchase_id,company_id) references public.purchases(id,company_id),check(paid_amount<=original_amount and remaining_amount=original_amount-paid_amount));
create index payables_scope_idx on public.payables(company_id,status,due_date,id);
create table public.receivables(
 id uuid primary key default gen_random_uuid(),company_id uuid not null,customer_id uuid not null,sale_id uuid,
 original_amount numeric(18,3) not null check(original_amount>0),paid_amount numeric(18,3) not null default 0 check(paid_amount>=0),
 remaining_amount numeric(18,3) not null check(remaining_amount>=0),due_date date,status text not null default 'OPEN' check(status in('OPEN','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,company_id),unique(company_id,sale_id),
 foreign key(company_id) references public.companies(id),foreign key(customer_id,company_id) references public.customers(id,company_id),
 foreign key(sale_id,company_id) references public.sales(id,company_id),check(paid_amount<=original_amount and remaining_amount=original_amount-paid_amount));
create index receivables_scope_idx on public.receivables(company_id,status,due_date,id);
create table public.financial_transactions(
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id),store_id uuid,branch_id uuid,
 event_type text not null check(event_type in('SALE_INCOME','PURCHASE_PAYMENT','EXPENSE','REFUND','RECEIVABLE_PAYMENT','PAYABLE_PAYMENT','OTHER_ADJUSTMENT')),
 direction text not null check(direction in('IN','OUT')),source_type text not null,source_id uuid not null,idempotency_key text not null,
 amount numeric(18,3) not null check(amount>0),payment_method text,actor_user_id uuid not null references public.profiles(id),
 occurred_at timestamptz not null default now(),metadata jsonb not null default '{}'::jsonb,
 unique(company_id,idempotency_key),unique(company_id,source_type,source_id,event_type),
 foreign key(store_id,company_id) references public.stores(id,company_id),foreign key(branch_id,company_id) references public.branches(id,company_id));
create index financial_transactions_scope_idx on public.financial_transactions(company_id,branch_id,occurred_at desc,id desc);

do $$ declare t text; begin foreach t in array array['suppliers','customers','employees','employee_branch_assignments','employee_work_shifts','attendance_records','expense_categories','expenses','purchases','purchase_items','purchase_status_history','purchase_receipts','purchase_receipt_items','payables','receivables','financial_transactions','purchase_number_counters'] loop
 execute format('alter table public.%I enable row level security',t);execute format('revoke all on table public.%I from anon,authenticated',t);end loop;end $$;
grant select on public.suppliers,public.customers,public.employees,public.employee_branch_assignments,public.employee_work_shifts,public.attendance_records,
 public.expense_categories,public.expenses,public.purchases,public.purchase_items,public.purchase_status_history,public.purchase_receipts,
 public.purchase_receipt_items,public.payables,public.receivables,public.financial_transactions to authenticated;
create policy suppliers_read on public.suppliers for select to authenticated using((select private.has_phase2_permission(company_id,null,'supplier.read')));
create policy customers_read on public.customers for select to authenticated using((select private.has_phase2_permission(company_id,null,'customer.read')));
create policy employees_read on public.employees for select to authenticated using((select private.has_phase2_permission(company_id,primary_branch_id,'employee.read')));
create policy employee_assignments_read on public.employee_branch_assignments for select to authenticated using((select private.has_phase2_permission(company_id,branch_id,'employee.read')));
create policy employee_shifts_read on public.employee_work_shifts for select to authenticated using((select private.has_phase2_permission(company_id,branch_id,'employee.read')));
create policy attendance_read on public.attendance_records for select to authenticated using((select private.has_phase2_permission(company_id,branch_id,'attendance.read')));
create policy expense_categories_read on public.expense_categories for select to authenticated using((select private.has_phase2_permission(company_id,null,'expense.read')));
create policy expenses_read on public.expenses for select to authenticated using((select private.has_phase2_permission(company_id,branch_id,'expense.read')));
create policy purchases_read on public.purchases for select to authenticated using((select private.has_phase2_permission(company_id,branch_id,'purchase.read')));
create policy purchase_items_read on public.purchase_items for select to authenticated using(exists(select 1 from public.purchases p where p.id=purchase_items.purchase_id and p.company_id=purchase_items.company_id and (select private.has_phase2_permission(p.company_id,p.branch_id,'purchase.read'))));
create policy purchase_history_read on public.purchase_status_history for select to authenticated using(exists(select 1 from public.purchases p where p.id=purchase_status_history.purchase_id and p.company_id=purchase_status_history.company_id and (select private.has_phase2_permission(p.company_id,p.branch_id,'purchase.read'))));
create policy purchase_receipts_read on public.purchase_receipts for select to authenticated using(exists(select 1 from public.purchases p where p.id=purchase_receipts.purchase_id and p.company_id=purchase_receipts.company_id and (select private.has_phase2_permission(p.company_id,p.branch_id,'purchase.read'))));
create policy purchase_receipt_items_read on public.purchase_receipt_items for select to authenticated using(exists(select 1 from public.purchase_receipts r join public.purchases p on p.id=r.purchase_id where r.id=purchase_receipt_items.receipt_id and r.company_id=purchase_receipt_items.company_id and (select private.has_phase2_permission(p.company_id,p.branch_id,'purchase.read'))));
create policy payables_read on public.payables for select to authenticated using((select private.has_phase2_permission(company_id,null,'payable.read')));
create policy receivables_read on public.receivables for select to authenticated using((select private.has_phase2_permission(company_id,null,'receivable.read')));
create policy financial_transactions_read on public.financial_transactions for select to authenticated using((select private.has_phase2_permission(company_id,branch_id,'finance.read')));

create or replace function private.next_purchase_number(target_company_id uuid,target_branch_id uuid) returns text language plpgsql security definer set search_path='' as $$ declare n bigint;begin
 insert into public.purchase_number_counters(company_id,branch_id,business_date,last_number) values(target_company_id,target_branch_id,current_date,1)
 on conflict(company_id,branch_id,business_date) do update set last_number=public.purchase_number_counters.last_number+1 returning last_number into n;
 return 'PUR-'||to_char(current_date,'YYYYMMDD')||'-'||upper(substr(replace(target_branch_id::text,'-',''),1,6))||'-'||lpad(n::text,6,'0');end $$;

create or replace function public.create_purchase(target_company_id uuid,target_store_id uuid,target_branch_id uuid,target_warehouse_id uuid,target_supplier_id uuid,target_purchase_date date,actor_id uuid,target_items jsonb,target_discount numeric default 0,target_tax numeric default 0,target_notes text default null) returns uuid
language plpgsql security definer set search_path='' as $$ declare pid uuid:=gen_random_uuid();item jsonb;product_row public.products;sub numeric:=0;qty numeric;cost numeric;begin
 if coalesce(jsonb_array_length(target_items),0)=0 then raise exception 'PURCHASE_ITEMS_REQUIRED';end if;if target_discount<0 or target_tax<0 then raise exception 'INVALID_TOTAL_ADJUSTMENT';end if;
 perform 1 from public.warehouses where id=target_warehouse_id and company_id=target_company_id and store_id=target_store_id and branch_id=target_branch_id and status='active';if not found then raise exception 'WAREHOUSE_SCOPE_INVALID';end if;
 perform 1 from public.suppliers where id=target_supplier_id and company_id=target_company_id and status='active';if not found then raise exception 'SUPPLIER_INVALID';end if;
 insert into public.purchases(id,company_id,store_id,branch_id,warehouse_id,supplier_id,purchase_number,purchase_date,created_by,notes)
 values(pid,target_company_id,target_store_id,target_branch_id,target_warehouse_id,target_supplier_id,private.next_purchase_number(target_company_id,target_branch_id),target_purchase_date,actor_id,target_notes);
 for item in select value from jsonb_array_elements(target_items) loop qty:=(item->>'quantity')::numeric;cost:=(item->>'unitCost')::numeric;if qty<=0 or cost<0 then raise exception 'INVALID_PURCHASE_ITEM';end if;
  select * into product_row from public.products where id=(item->>'productId')::uuid and company_id=target_company_id and status='active';if not found then raise exception 'PRODUCT_INVALID';end if;
  insert into public.purchase_items(company_id,purchase_id,product_id,quantity,unit_cost,line_total) values(target_company_id,pid,product_row.id,qty,cost,round(qty*cost,3));sub:=sub+round(qty*cost,3);end loop;
 if target_discount>sub then raise exception 'DISCOUNT_EXCEEDS_SUBTOTAL';end if;
 update public.purchases set subtotal=sub,discount=target_discount,tax=target_tax,grand_total=sub-target_discount+target_tax where id=pid;
 insert into public.payables(company_id,supplier_id,purchase_id,original_amount,remaining_amount) select company_id,supplier_id,id,grand_total,grand_total from public.purchases where id=pid and grand_total>0;
 insert into public.purchase_status_history(company_id,purchase_id,from_status,to_status,actor_user_id,reason) values(target_company_id,pid,'DRAFT','ORDERED',actor_id,'Purchase created');
 insert into public.audit_logs(company_id,branch_id,actor_user_id,action,resource_type,resource_id) values(target_company_id,target_branch_id,actor_id,'purchase.created','purchase',pid);return pid;end $$;

create or replace function public.receive_purchase(target_company_id uuid,target_purchase_id uuid,actor_id uuid,target_idempotency_key text,target_items jsonb,target_notes text default null) returns uuid
language plpgsql security definer set search_path='' as $$ declare p public.purchases;rid uuid;entry jsonb;pi public.purchase_items;qty numeric;stock public.inventory;remaining int;begin
 select * into p from public.purchases where id=target_purchase_id and company_id=target_company_id for update;if not found then raise exception 'PURCHASE_NOT_FOUND';end if;
 if p.status not in('ORDERED','PARTIALLY_RECEIVED') then raise exception 'PURCHASE_NOT_RECEIVABLE';end if;
 select id into rid from public.purchase_receipts where company_id=target_company_id and idempotency_key=target_idempotency_key;if rid is not null then return rid;end if;
 if coalesce(jsonb_array_length(target_items),0)=0 then raise exception 'RECEIPT_ITEMS_REQUIRED';end if;
 insert into public.purchase_receipts(company_id,purchase_id,idempotency_key,received_by,notes) values(target_company_id,p.id,target_idempotency_key,actor_id,target_notes) returning id into rid;
 for entry in select value from jsonb_array_elements(target_items) order by value->>'purchaseItemId' loop qty:=(entry->>'quantity')::numeric;if qty<=0 then raise exception 'INVALID_RECEIVE_QUANTITY';end if;
  select * into pi from public.purchase_items where id=(entry->>'purchaseItemId')::uuid and purchase_id=p.id and company_id=target_company_id for update;if not found then raise exception 'PURCHASE_ITEM_NOT_FOUND';end if;
  if pi.received_quantity+qty>pi.quantity then raise exception 'RECEIVE_EXCEEDS_ORDERED';end if;
  update public.purchase_items set received_quantity=received_quantity+qty where id=pi.id;
  insert into public.purchase_receipt_items(company_id,receipt_id,purchase_item_id,quantity) values(target_company_id,rid,pi.id,qty);
  insert into public.inventory(company_id,branch_id,warehouse_id,product_id,quantity,minimum_stock) values(target_company_id,p.branch_id,p.warehouse_id,pi.product_id,qty,0)
  on conflict(warehouse_id,product_id) do update set quantity=public.inventory.quantity+excluded.quantity,updated_at=now() returning * into stock;
  insert into public.inventory_movements(company_id,branch_id,warehouse_id,product_id,movement_type,quantity,balance_after,reference_type,reference_id,actor_user_id,notes)
  values(target_company_id,p.branch_id,p.warehouse_id,pi.product_id,'PURCHASE',qty,stock.quantity,'purchase_receipt',rid,actor_id,target_notes);end loop;
 select count(*) into remaining from public.purchase_items where purchase_id=p.id and received_quantity<quantity;
 update public.purchases set status=case when remaining=0 then 'RECEIVED' else 'PARTIALLY_RECEIVED' end,updated_at=now() where id=p.id;
 insert into public.purchase_status_history(company_id,purchase_id,from_status,to_status,actor_user_id,reason) select target_company_id,p.id,p.status,status,actor_id,'Goods received' from public.purchases where id=p.id;
 insert into public.audit_logs(company_id,branch_id,actor_user_id,action,resource_type,resource_id,metadata) values(target_company_id,p.branch_id,actor_id,'purchase.received','purchase',p.id,jsonb_build_object('receipt_id',rid));return rid;end $$;

create or replace function public.cancel_purchase(target_company_id uuid,target_purchase_id uuid,actor_id uuid,target_reason text) returns public.purchases
language plpgsql security definer set search_path='' as $$ declare p public.purchases;old_status text;begin if length(trim(coalesce(target_reason,'')))<3 then raise exception 'CANCELLATION_REASON_REQUIRED';end if;
 select * into p from public.purchases where id=target_purchase_id and company_id=target_company_id for update;if not found then raise exception 'PURCHASE_NOT_FOUND';end if;
 if exists(select 1 from public.purchase_items where purchase_id=p.id and received_quantity>0) then raise exception 'RECEIVED_PURCHASE_CANNOT_CANCEL';end if;if p.status='CANCELLED' then return p;end if;old_status:=p.status;
 update public.purchases set status='CANCELLED',payment_status='CANCELLED',cancellation_reason=target_reason,cancelled_by=actor_id,cancelled_at=now(),updated_at=now() where id=p.id returning * into p;
 update public.payables set status='CANCELLED',updated_at=now() where purchase_id=p.id and paid_amount=0;
 insert into public.purchase_status_history(company_id,purchase_id,from_status,to_status,reason,actor_user_id) values(target_company_id,p.id,old_status,'CANCELLED',target_reason,actor_id);
 insert into public.audit_logs(company_id,branch_id,actor_user_id,action,resource_type,resource_id,metadata) values(target_company_id,p.branch_id,actor_id,'purchase.cancelled','purchase',p.id,jsonb_build_object('reason',target_reason));return p;end $$;

create or replace function public.record_expense(target_company_id uuid,target_store_id uuid,target_branch_id uuid,target_category_id uuid,target_amount numeric,target_date date,target_description text,target_payment_method text,target_reference text,actor_id uuid,target_idempotency_key text) returns uuid
language plpgsql security definer set search_path='' as $$ declare eid uuid;begin if target_amount<=0 then raise exception 'INVALID_EXPENSE_AMOUNT';end if;
 select id into eid from public.expenses where company_id=target_company_id and idempotency_key=target_idempotency_key;if eid is not null then return eid;end if;
 insert into public.expenses(company_id,store_id,branch_id,category_id,amount,expense_date,description,payment_method,reference,created_by,idempotency_key)
 values(target_company_id,target_store_id,target_branch_id,target_category_id,target_amount,target_date,target_description,target_payment_method,target_reference,actor_id,target_idempotency_key) returning id into eid;
 insert into public.financial_transactions(company_id,store_id,branch_id,event_type,direction,source_type,source_id,idempotency_key,amount,payment_method,actor_user_id,occurred_at)
 values(target_company_id,target_store_id,target_branch_id,'EXPENSE','OUT','expense',eid,'expense:'||target_idempotency_key,target_amount,target_payment_method,actor_id,target_date::timestamptz);
 insert into public.audit_logs(company_id,branch_id,actor_user_id,action,resource_type,resource_id) values(target_company_id,target_branch_id,actor_id,'expense.created','expense',eid);return eid;end $$;

create or replace function public.clock_employee(target_company_id uuid,target_employee_id uuid,target_branch_id uuid,actor_id uuid,target_action text,target_notes text default null) returns public.attendance_records
language plpgsql security definer set search_path='' as $$ declare result public.attendance_records;begin
 perform 1 from public.employee_branch_assignments where company_id=target_company_id and employee_id=target_employee_id and branch_id=target_branch_id and status='active';if not found then raise exception 'EMPLOYEE_BRANCH_ACCESS_DENIED';end if;
 if target_action='CLOCK_IN' then insert into public.attendance_records(company_id,employee_id,branch_id,attendance_date,clock_in_at,clocked_by,notes) values(target_company_id,target_employee_id,target_branch_id,current_date,now(),actor_id,target_notes) returning * into result;
 elsif target_action='CLOCK_OUT' then update public.attendance_records set clock_out_at=now(),updated_at=now(),notes=coalesce(target_notes,notes) where id=(select id from public.attendance_records where company_id=target_company_id and employee_id=target_employee_id and branch_id=target_branch_id and clock_out_at is null for update) returning * into result;if result.id is null then raise exception 'NO_ACTIVE_CLOCK_IN';end if;
 else raise exception 'INVALID_CLOCK_ACTION';end if;
 insert into public.audit_logs(company_id,branch_id,actor_user_id,action,resource_type,resource_id) values(target_company_id,target_branch_id,actor_id,lower(target_action),'attendance',result.id);return result;end $$;

create or replace function public.record_payable_payment(target_company_id uuid,target_payable_id uuid,target_amount numeric,target_method text,actor_id uuid,target_idempotency_key text) returns public.payables
language plpgsql security definer set search_path='' as $$ declare p public.payables;pu public.purchases;begin
 if exists(select 1 from public.financial_transactions where company_id=target_company_id and idempotency_key='payable:'||target_idempotency_key) then select * into p from public.payables where id=target_payable_id and company_id=target_company_id;return p;end if;
 select * into p from public.payables where id=target_payable_id and company_id=target_company_id for update;if not found then raise exception 'PAYABLE_NOT_FOUND';end if;
 if target_amount<=0 or target_amount>p.remaining_amount then raise exception 'PAYABLE_OVERPAYMENT';end if;
 update public.payables set paid_amount=paid_amount+target_amount,remaining_amount=remaining_amount-target_amount,status=case when remaining_amount-target_amount=0 then 'PAID' else 'PARTIALLY_PAID' end,updated_at=now() where id=p.id returning * into p;
 select * into pu from public.purchases where id=p.purchase_id;update public.purchases set payment_status=case when p.status='PAID' then 'PAID' else 'PARTIALLY_PAID' end,updated_at=now() where id=p.purchase_id;
 insert into public.financial_transactions(company_id,store_id,branch_id,event_type,direction,source_type,source_id,idempotency_key,amount,payment_method,actor_user_id)
 values(target_company_id,pu.store_id,pu.branch_id,'PAYABLE_PAYMENT','OUT','payable',p.id,'payable:'||target_idempotency_key,target_amount,target_method,actor_id);
 insert into public.audit_logs(company_id,branch_id,actor_user_id,action,resource_type,resource_id) values(target_company_id,pu.branch_id,actor_id,'payable.payment','payable',p.id);return p;end $$;

create or replace function public.record_receivable_payment(target_company_id uuid,target_receivable_id uuid,target_amount numeric,target_method text,actor_id uuid,target_idempotency_key text) returns public.receivables
language plpgsql security definer set search_path='' as $$ declare r public.receivables;s public.sales;begin
 if exists(select 1 from public.financial_transactions where company_id=target_company_id and idempotency_key='receivable:'||target_idempotency_key) then select * into r from public.receivables where id=target_receivable_id and company_id=target_company_id;return r;end if;
 select * into r from public.receivables where id=target_receivable_id and company_id=target_company_id for update;if not found then raise exception 'RECEIVABLE_NOT_FOUND';end if;
 if target_amount<=0 or target_amount>r.remaining_amount then raise exception 'RECEIVABLE_OVERPAYMENT';end if;
 update public.receivables set paid_amount=paid_amount+target_amount,remaining_amount=remaining_amount-target_amount,status=case when remaining_amount-target_amount=0 then 'PAID' else 'PARTIALLY_PAID' end,updated_at=now() where id=r.id returning * into r;
 select * into s from public.sales where id=r.sale_id;
 insert into public.financial_transactions(company_id,store_id,branch_id,event_type,direction,source_type,source_id,idempotency_key,amount,payment_method,actor_user_id)
 values(target_company_id,s.store_id,s.branch_id,'RECEIVABLE_PAYMENT','IN','receivable',r.id,'receivable:'||target_idempotency_key,target_amount,target_method,actor_id);
 insert into public.audit_logs(company_id,branch_id,actor_user_id,action,resource_type,resource_id) values(target_company_id,s.branch_id,actor_id,'receivable.payment','receivable',r.id);return r;end $$;

revoke all on function private.next_purchase_number(uuid,uuid) from public,anon,authenticated;
revoke all on function public.create_purchase(uuid,uuid,uuid,uuid,uuid,date,uuid,jsonb,numeric,numeric,text) from public,anon,authenticated;
revoke all on function public.receive_purchase(uuid,uuid,uuid,text,jsonb,text),public.cancel_purchase(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.record_expense(uuid,uuid,uuid,uuid,numeric,date,text,text,text,uuid,text),public.clock_employee(uuid,uuid,uuid,uuid,text,text) from public,anon,authenticated;
revoke all on function public.record_payable_payment(uuid,uuid,numeric,text,uuid,text),public.record_receivable_payment(uuid,uuid,numeric,text,uuid,text) from public,anon,authenticated;
grant execute on function private.next_purchase_number(uuid,uuid),public.create_purchase(uuid,uuid,uuid,uuid,uuid,date,uuid,jsonb,numeric,numeric,text),
 public.receive_purchase(uuid,uuid,uuid,text,jsonb,text),public.cancel_purchase(uuid,uuid,uuid,text),
 public.record_expense(uuid,uuid,uuid,uuid,numeric,date,text,text,text,uuid,text),public.clock_employee(uuid,uuid,uuid,uuid,text,text),
 public.record_payable_payment(uuid,uuid,numeric,text,uuid,text),public.record_receivable_payment(uuid,uuid,numeric,text,uuid,text) to service_role;

insert into public.permissions(permission_key,display_name) values
('supplier.read','Read suppliers'),('supplier.create','Create suppliers'),('supplier.update','Update suppliers'),('supplier.manage','Manage suppliers'),
('purchase.read','Read purchases'),('purchase.create','Create purchases'),('purchase.update','Update purchases'),('purchase.receive','Receive purchases'),('purchase.cancel','Cancel purchases'),
('customer.read','Read customers'),('customer.create','Create customers'),('customer.update','Update customers'),('customer.manage','Manage customers'),
('employee.read','Read employees'),('employee.create','Create employees'),('employee.update','Update employees'),('employee.assign','Assign employees'),
('attendance.read','Read attendance'),('attendance.clock','Clock attendance'),('attendance.manage','Manage attendance'),
('expense.read','Read expenses'),('expense.create','Create expenses'),('expense.update','Update expenses'),('expense.manage','Manage expenses'),
('payable.read','Read payables'),('payable.manage','Manage payables'),('receivable.read','Read receivables'),('receivable.manage','Manage receivables')
on conflict(permission_key) do update set display_name=excluded.display_name;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.permission_key like any(array['supplier.%','purchase.%','customer.%','employee.%','attendance.%','expense.%','payable.%','receivable.%']) where r.scope='company' and r.role_key='owner' on conflict do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.permission_key in('supplier.read','supplier.create','supplier.update','purchase.read','purchase.create','purchase.update','purchase.receive','purchase.cancel','customer.read','customer.create','customer.update','employee.read','employee.create','employee.update','employee.assign','attendance.read','attendance.clock','attendance.manage','expense.read','expense.create','expense.update','finance.read','payable.read','payable.manage','receivable.read','receivable.manage') where r.scope='company' and r.role_key='company_admin' on conflict do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.permission_key in('expense.read','expense.create','finance.read','payable.read','payable.manage','receivable.read','receivable.manage','purchase.read','supplier.read','customer.read') where r.scope='company' and r.role_key in('finance','accountant') on conflict do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.permission_key in('employee.read','employee.create','employee.update','employee.assign','attendance.read','attendance.clock','attendance.manage') where r.scope='company' and r.role_key='hr' on conflict do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.permission_key in('supplier.read','purchase.read','purchase.create','purchase.receive','customer.read','employee.read','attendance.read','attendance.clock','expense.read','expense.create') where r.scope='branch' and r.role_key='manager' on conflict do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.permission_key in('purchase.read','purchase.receive','supplier.read','inventory.read') where r.scope='branch' and r.role_key='warehouse' on conflict do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.permission_key in('employee.read','attendance.read','attendance.clock') where r.scope='branch' and r.role_key in('supervisor','employee') on conflict do nothing;

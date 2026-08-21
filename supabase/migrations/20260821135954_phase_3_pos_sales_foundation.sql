-- NIAGANTARA Phase 3 POS, sales, cashier shifts, payments and refunds.
-- All writes are server-only atomic RPCs; authenticated clients receive scoped reads through RLS.

create table public.cashier_shifts (
  id uuid primary key default gen_random_uuid(), company_id uuid not null, store_id uuid not null, branch_id uuid not null,
  cashier_id uuid not null references public.profiles(id), opening_cash numeric(18,2) not null check (opening_cash>=0),
  opened_at timestamptz not null default now(), closed_at timestamptz, closing_cash numeric(18,2), expected_cash numeric(18,2), cash_difference numeric(18,2),
  status text not null default 'OPEN' check (status in ('OPEN','CLOSED')),
  foreign key (store_id,company_id) references public.stores(id,company_id),
  foreign key (branch_id,company_id,store_id) references public.branches(id,company_id,store_id), unique(id,company_id)
);
create unique index cashier_shifts_one_open_idx on public.cashier_shifts(company_id,branch_id,cashier_id) where status='OPEN';
create index cashier_shifts_scope_idx on public.cashier_shifts(company_id,branch_id,opened_at desc);
create index cashier_shifts_cashier_idx on public.cashier_shifts(cashier_id,opened_at desc);

create table public.sale_number_counters (
  company_id uuid not null, branch_id uuid not null, business_date date not null, last_value bigint not null check(last_value>0),
  primary key(company_id,branch_id,business_date), foreign key(branch_id,company_id) references public.branches(id,company_id) on delete cascade
);
create table public.sales (
  id uuid primary key default gen_random_uuid(), company_id uuid not null, store_id uuid not null, branch_id uuid not null, warehouse_id uuid not null,
  shift_id uuid not null, cashier_id uuid not null references public.profiles(id), transaction_number text not null,
  status text not null check(status in ('DRAFT','PENDING','PAID','CANCELLED','REFUNDED','PARTIALLY_REFUNDED')),
  subtotal numeric(18,2) not null check(subtotal>=0), item_discount_total numeric(18,2) not null default 0 check(item_discount_total>=0),
  transaction_discount numeric(18,2) not null default 0 check(transaction_discount>=0), tax_total numeric(18,2) not null default 0 check(tax_total>=0),
  grand_total numeric(18,2) not null check(grand_total>=0), refunded_total numeric(18,2) not null default 0 check(refunded_total>=0),
  idempotency_key text not null check(length(idempotency_key) between 8 and 160), completed_at timestamptz,
  cancelled_at timestamptz, cancelled_by uuid references public.profiles(id), cancellation_reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(company_id,transaction_number), unique(company_id,idempotency_key), unique(id,company_id),
  foreign key(store_id,company_id) references public.stores(id,company_id),
  foreign key(branch_id,company_id,store_id) references public.branches(id,company_id,store_id),
  foreign key(warehouse_id,company_id) references public.warehouses(id,company_id),
  foreign key(shift_id,company_id) references public.cashier_shifts(id,company_id)
);
create index sales_scope_created_idx on public.sales(company_id,branch_id,created_at desc,id desc);
create index sales_cashier_created_idx on public.sales(cashier_id,created_at desc);
create index sales_status_created_idx on public.sales(company_id,status,created_at desc);
create index sales_shift_idx on public.sales(shift_id);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(), sale_id uuid not null, company_id uuid not null, product_id uuid not null,
  sku text not null, barcode text, product_name text not null, unit_price numeric(18,2) not null check(unit_price>=0), quantity numeric(18,3) not null check(quantity>0),
  discount_type text check(discount_type in ('PERCENT','FIXED')), discount_value numeric(18,2) not null default 0 check(discount_value>=0),
  discount_amount numeric(18,2) not null default 0 check(discount_amount>=0), line_subtotal numeric(18,2) not null check(line_subtotal>=0), line_total numeric(18,2) not null check(line_total>=0),
  foreign key(sale_id,company_id) references public.sales(id,company_id) on delete restrict,
  foreign key(product_id,company_id) references public.products(id,company_id), unique(id,company_id)
);
create index sale_items_sale_idx on public.sale_items(sale_id);
create index sale_items_product_idx on public.sale_items(company_id,product_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(), sale_id uuid not null, company_id uuid not null, store_id uuid not null, branch_id uuid not null,
  method text not null check(method in ('CASH','QRIS','BANK_TRANSFER','E_WALLET','OTHER')),
  status text not null check(status in ('PENDING','RECORDED','FAILED','REFUNDED','PARTIALLY_REFUNDED')),
  amount numeric(18,2) not null check(amount>=0), amount_received numeric(18,2), change_amount numeric(18,2) not null default 0 check(change_amount>=0),
  reference text, provider text, provider_payment_id text, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
  unique(sale_id), unique(id,company_id), foreign key(sale_id,company_id) references public.sales(id,company_id) on delete restrict,
  foreign key(store_id,company_id) references public.stores(id,company_id), foreign key(branch_id,company_id,store_id) references public.branches(id,company_id,store_id)
);
create index payments_scope_idx on public.payments(company_id,branch_id,created_at desc);

create table public.sale_status_history (
  id uuid primary key default gen_random_uuid(), sale_id uuid not null, company_id uuid not null, branch_id uuid not null,
  from_status text, to_status text not null, reason text, actor_user_id uuid not null references public.profiles(id), created_at timestamptz not null default now(),
  foreign key(sale_id,company_id) references public.sales(id,company_id) on delete restrict, foreign key(branch_id,company_id) references public.branches(id,company_id)
);
create index sale_status_history_sale_idx on public.sale_status_history(sale_id,created_at);
create index sale_status_history_scope_idx on public.sale_status_history(company_id,branch_id,created_at desc);

create table public.refunds (
  id uuid primary key default gen_random_uuid(), sale_id uuid not null, company_id uuid not null, store_id uuid not null, branch_id uuid not null,
  refund_number text not null, type text not null check(type in ('FULL','PARTIAL')), amount numeric(18,2) not null check(amount>0),
  reason text not null check(length(btrim(reason))>=3), status text not null default 'COMPLETED' check(status in ('PENDING','COMPLETED','REJECTED')),
  actor_user_id uuid not null references public.profiles(id), created_at timestamptz not null default now(),
  unique(company_id,refund_number), unique(id,company_id), foreign key(sale_id,company_id) references public.sales(id,company_id) on delete restrict,
  foreign key(store_id,company_id) references public.stores(id,company_id), foreign key(branch_id,company_id,store_id) references public.branches(id,company_id,store_id)
);
create index refunds_sale_idx on public.refunds(sale_id,created_at desc);
create index refunds_scope_idx on public.refunds(company_id,branch_id,created_at desc);
create table public.refund_items (
  id uuid primary key default gen_random_uuid(), refund_id uuid not null, sale_item_id uuid not null, company_id uuid not null,
  product_id uuid not null, quantity numeric(18,3) not null check(quantity>0), amount numeric(18,2) not null check(amount>=0),
  restock boolean not null default false, condition text not null default 'SELLABLE' check(condition in ('SELLABLE','DAMAGED','NOT_RETURNED')),
  foreign key(refund_id,company_id) references public.refunds(id,company_id) on delete restrict,
  foreign key(sale_item_id,company_id) references public.sale_items(id,company_id) on delete restrict,
  foreign key(product_id,company_id) references public.products(id,company_id)
);
create index refund_items_refund_idx on public.refund_items(refund_id);
create index refund_items_sale_item_idx on public.refund_items(sale_item_id);

alter table public.cashier_shifts enable row level security;
alter table public.sale_number_counters enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.sale_status_history enable row level security;
alter table public.refunds enable row level security;
alter table public.refund_items enable row level security;
revoke all on table public.cashier_shifts,public.sale_number_counters,public.sales,public.sale_items,public.payments,public.sale_status_history,public.refunds,public.refund_items from anon,authenticated;
grant select on table public.cashier_shifts,public.sales,public.sale_items,public.payments,public.sale_status_history,public.refunds,public.refund_items to authenticated;

create policy shifts_read on public.cashier_shifts for select to authenticated using ((select private.has_phase2_permission(company_id,branch_id,'shift.read')));
create policy sales_read on public.sales for select to authenticated using ((select private.has_phase2_permission(company_id,branch_id,'sale.read')));
create policy sale_items_read on public.sale_items for select to authenticated using (exists(select 1 from public.sales s where s.id=sale_items.sale_id and s.company_id=sale_items.company_id and (select private.has_phase2_permission(s.company_id,s.branch_id,'sale.read'))));
create policy payments_read on public.payments for select to authenticated using ((select private.has_phase2_permission(company_id,branch_id,'payment.read')));
create policy sale_history_read on public.sale_status_history for select to authenticated using ((select private.has_phase2_permission(company_id,branch_id,'sale.read')));
create policy refunds_read on public.refunds for select to authenticated using ((select private.has_phase2_permission(company_id,branch_id,'sale.read')));
create policy refund_items_read on public.refund_items for select to authenticated using (exists(select 1 from public.refunds r where r.id=refund_items.refund_id and r.company_id=refund_items.company_id and (select private.has_phase2_permission(r.company_id,r.branch_id,'sale.read'))));

create or replace function private.next_sale_number(target_company_id uuid,target_branch_id uuid,target_prefix text default 'NIA') returns text
language plpgsql security definer set search_path='' as $$
declare next_value bigint; branch_code text; sale_date date:=current_date;
begin
 select b.code into branch_code from public.branches b where b.id=target_branch_id and b.company_id=target_company_id;
 if branch_code is null then raise exception 'BRANCH_RELATION_INVALID'; end if;
 insert into public.sale_number_counters(company_id,branch_id,business_date,last_value) values(target_company_id,target_branch_id,sale_date,1)
 on conflict(company_id,branch_id,business_date) do update set last_value=public.sale_number_counters.last_value+1 returning last_value into next_value;
 return target_prefix||'-'||to_char(sale_date,'YYYYMMDD')||'-'||upper(regexp_replace(branch_code,'[^A-Za-z0-9]','','g'))||'-'||lpad(next_value::text,6,'0');
end; $$;

create or replace function public.cancel_sale(target_company_id uuid,target_sale_id uuid,actor_id uuid,target_reason text)
returns public.sales language plpgsql security definer set search_path='' as $$
declare result public.sales; item record; stock public.inventory;
begin
 if (select auth.role())<>'service_role' or actor_id is null then raise exception 'SERVER_CONTEXT_REQUIRED'; end if;
 if length(btrim(coalesce(target_reason,'')))<3 then raise exception 'CANCELLATION_REASON_REQUIRED'; end if;
 select * into result from public.sales where id=target_sale_id and company_id=target_company_id for update;
 if result.id is null or result.status<>'PAID' then raise exception 'SALE_NOT_CANCELLABLE'; end if;
 for item in select * from public.sale_items where sale_id=result.id order by product_id loop
  update public.inventory set quantity=quantity+item.quantity,updated_at=now() where company_id=result.company_id and warehouse_id=result.warehouse_id and product_id=item.product_id returning * into stock;
  insert into public.inventory_movements(company_id,branch_id,warehouse_id,product_id,movement_type,quantity,balance_after,reference_type,reference_id,actor_user_id,notes) values(result.company_id,result.branch_id,result.warehouse_id,item.product_id,'RETURN',item.quantity,stock.quantity,'sale_cancellation',result.id,actor_id,target_reason);
 end loop;
 update public.sales set status='CANCELLED',cancelled_at=now(),cancelled_by=actor_id,cancellation_reason=target_reason,updated_at=now() where id=result.id returning * into result;
 insert into public.sale_status_history(sale_id,company_id,branch_id,from_status,to_status,reason,actor_user_id) values(result.id,result.company_id,result.branch_id,'PAID','CANCELLED',target_reason,actor_id);
 insert into public.audit_logs(company_id,branch_id,actor_user_id,action,resource_type,resource_id,metadata) values(result.company_id,result.branch_id,actor_id,'sale.cancelled','sale',result.id,jsonb_build_object('reason',target_reason));
 return result;
end; $$;

create or replace function public.refund_sale(target_company_id uuid,target_sale_id uuid,actor_id uuid,target_reason text,items jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare sale_row public.sales; refund_id uuid:=gen_random_uuid(); refund_amount numeric:=0; line jsonb; sold public.sale_items; prior_qty numeric; qty numeric; amount_value numeric; stock public.inventory; refund_type text; new_refunded numeric;
begin
 if (select auth.role())<>'service_role' or actor_id is null then raise exception 'SERVER_CONTEXT_REQUIRED'; end if;
 if length(btrim(coalesce(target_reason,'')))<3 or jsonb_typeof(items)<>'array' or jsonb_array_length(items)=0 then raise exception 'INVALID_REFUND'; end if;
 if jsonb_array_length(items)<>(select count(distinct (value->>'saleItemId')) from jsonb_array_elements(items)) then raise exception 'DUPLICATE_REFUND_ITEM'; end if;
 select * into sale_row from public.sales where id=target_sale_id and company_id=target_company_id for update;
 if sale_row.id is null or sale_row.status not in('PAID','PARTIALLY_REFUNDED') then raise exception 'SALE_NOT_REFUNDABLE'; end if;
 for line in select value from jsonb_array_elements(items) loop
  qty:=round((line->>'quantity')::numeric,3); if qty<=0 then raise exception 'INVALID_REFUND_QUANTITY'; end if;
  select * into sold from public.sale_items where id=(line->>'saleItemId')::uuid and sale_id=sale_row.id and company_id=target_company_id;
  if sold.id is null then raise exception 'REFUND_ITEM_INVALID'; end if;
  select coalesce(sum(ri.quantity),0) into prior_qty from public.refund_items ri join public.refunds r on r.id=ri.refund_id where ri.sale_item_id=sold.id and r.status='COMPLETED';
  if prior_qty+qty>sold.quantity then raise exception 'REFUND_QUANTITY_EXCEEDED'; end if;
  amount_value:=round(sold.line_total*qty/sold.quantity,2); refund_amount:=refund_amount+amount_value;
 end loop;
 new_refunded:=sale_row.refunded_total+refund_amount; if new_refunded>sale_row.grand_total then raise exception 'REFUND_AMOUNT_EXCEEDED'; end if;
 refund_type:=case when new_refunded=sale_row.grand_total then 'FULL' else 'PARTIAL' end;
 insert into public.refunds(id,sale_id,company_id,store_id,branch_id,refund_number,type,amount,reason,actor_user_id) values(refund_id,sale_row.id,sale_row.company_id,sale_row.store_id,sale_row.branch_id,'REF-'||sale_row.transaction_number||'-'||substr(refund_id::text,1,8),refund_type,refund_amount,target_reason,actor_id);
 for line in select value from jsonb_array_elements(items) loop
  qty:=round((line->>'quantity')::numeric,3); select * into sold from public.sale_items where id=(line->>'saleItemId')::uuid;
  amount_value:=round(sold.line_total*qty/sold.quantity,2);
  insert into public.refund_items(refund_id,sale_item_id,company_id,product_id,quantity,amount,restock,condition) values(refund_id,sold.id,target_company_id,sold.product_id,qty,amount_value,coalesce((line->>'restock')::boolean,false),coalesce(line->>'condition','NOT_RETURNED'));
  if coalesce((line->>'restock')::boolean,false) and coalesce(line->>'condition','')='SELLABLE' then
   update public.inventory set quantity=quantity+qty,updated_at=now() where company_id=target_company_id and warehouse_id=sale_row.warehouse_id and product_id=sold.product_id returning * into stock;
   insert into public.inventory_movements(company_id,branch_id,warehouse_id,product_id,movement_type,quantity,balance_after,reference_type,reference_id,actor_user_id,notes) values(target_company_id,sale_row.branch_id,sale_row.warehouse_id,sold.product_id,'RETURN',qty,stock.quantity,'refund',refund_id,actor_id,target_reason);
  end if;
 end loop;
 update public.sales set refunded_total=new_refunded,status=case when new_refunded=grand_total then 'REFUNDED' else 'PARTIALLY_REFUNDED' end,updated_at=now() where id=sale_row.id;
 update public.payments set status=case when new_refunded=sale_row.grand_total then 'REFUNDED' else 'PARTIALLY_REFUNDED' end where sale_id=sale_row.id;
 insert into public.sale_status_history(sale_id,company_id,branch_id,from_status,to_status,reason,actor_user_id) values(sale_row.id,target_company_id,sale_row.branch_id,sale_row.status,case when new_refunded=sale_row.grand_total then 'REFUNDED' else 'PARTIALLY_REFUNDED' end,target_reason,actor_id);
 insert into public.audit_logs(company_id,branch_id,actor_user_id,action,resource_type,resource_id,metadata) values(target_company_id,sale_row.branch_id,actor_id,'refund.created','refund',refund_id,jsonb_build_object('amount',refund_amount,'type',refund_type));
 return refund_id;
end; $$;

revoke all on function private.next_sale_number(uuid,uuid,text) from public,anon,authenticated;
grant execute on function private.next_sale_number(uuid,uuid,text) to service_role;

create or replace function public.open_cashier_shift(target_company_id uuid,target_store_id uuid,target_branch_id uuid,actor_id uuid,target_opening_cash numeric)
returns public.cashier_shifts language plpgsql security definer set search_path='' as $$
declare result public.cashier_shifts;
begin
 if (select auth.role())<>'service_role' or actor_id is null then raise exception 'SERVER_CONTEXT_REQUIRED'; end if;
 if target_opening_cash<0 then raise exception 'INVALID_OPENING_CASH'; end if;
 if not exists(select 1 from public.branches b where b.id=target_branch_id and b.company_id=target_company_id and b.store_id=target_store_id and b.status='active') then raise exception 'BRANCH_RELATION_INVALID'; end if;
 insert into public.cashier_shifts(company_id,store_id,branch_id,cashier_id,opening_cash) values(target_company_id,target_store_id,target_branch_id,actor_id,target_opening_cash) returning * into result;
 insert into public.audit_logs(company_id,branch_id,actor_user_id,action,resource_type,resource_id) values(target_company_id,target_branch_id,actor_id,'shift.open','cashier_shift',result.id);
 return result;
end; $$;

create or replace function public.close_cashier_shift(target_company_id uuid,target_shift_id uuid,actor_id uuid,target_closing_cash numeric)
returns public.cashier_shifts language plpgsql security definer set search_path='' as $$
declare result public.cashier_shifts; cash_sales numeric;
begin
 if (select auth.role())<>'service_role' or actor_id is null then raise exception 'SERVER_CONTEXT_REQUIRED'; end if;
 select * into result from public.cashier_shifts where id=target_shift_id and company_id=target_company_id for update;
 if result.id is null or result.status<>'OPEN' then raise exception 'SHIFT_NOT_OPEN'; end if;
 if result.cashier_id<>actor_id then raise exception 'SHIFT_OWNER_MISMATCH'; end if;
 select coalesce(sum(greatest(p.amount-s.refunded_total,0)),0) into cash_sales from public.payments p join public.sales s on s.id=p.sale_id where s.shift_id=result.id and s.status in('PAID','PARTIALLY_REFUNDED','REFUNDED') and p.method='CASH' and p.status in('RECORDED','PARTIALLY_REFUNDED','REFUNDED');
 update public.cashier_shifts set status='CLOSED',closed_at=now(),closing_cash=target_closing_cash,expected_cash=opening_cash+cash_sales,cash_difference=target_closing_cash-(opening_cash+cash_sales) where id=result.id returning * into result;
 insert into public.audit_logs(company_id,branch_id,actor_user_id,action,resource_type,resource_id,metadata) values(result.company_id,result.branch_id,actor_id,'shift.close','cashier_shift',result.id,jsonb_build_object('cash_difference',result.cash_difference));
 return result;
end; $$;

create or replace function public.checkout_sale(target_company_id uuid,target_store_id uuid,target_branch_id uuid,target_warehouse_id uuid,target_shift_id uuid,actor_id uuid,target_idempotency_key text,cart jsonb,transaction_discount_type text,transaction_discount_value numeric,target_tax_rate numeric,payment_method text,amount_received numeric,payment_reference text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare existing_sale uuid; sale_id uuid:=gen_random_uuid(); txn text; line jsonb; product_row public.products; stock public.inventory; qty numeric; gross numeric; line_discount numeric; line_total numeric; subtotal_value numeric:=0; item_discount_value numeric:=0; txn_discount numeric:=0; tax_value numeric:=0; grand_value numeric; change_value numeric:=0; branch_row public.branches;
begin
 if (select auth.role())<>'service_role' or actor_id is null then raise exception 'SERVER_CONTEXT_REQUIRED'; end if;
 if length(target_idempotency_key)<8 or jsonb_typeof(cart)<>'array' or jsonb_array_length(cart)=0 then raise exception 'INVALID_CHECKOUT'; end if;
 if jsonb_array_length(cart)<>(select count(distinct (value->>'productId')) from jsonb_array_elements(cart)) then raise exception 'DUPLICATE_CART_PRODUCT'; end if;
 select id into existing_sale from public.sales where company_id=target_company_id and idempotency_key=target_idempotency_key;
 if existing_sale is not null then return existing_sale; end if;
 select * into branch_row from public.branches where id=target_branch_id and company_id=target_company_id and store_id=target_store_id and status='active';
 if branch_row.id is null then raise exception 'BRANCH_RELATION_INVALID'; end if;
 if not exists(select 1 from public.warehouses w where w.id=target_warehouse_id and w.company_id=target_company_id and w.branch_id=target_branch_id and w.store_id=target_store_id and w.status='active') then raise exception 'WAREHOUSE_RELATION_INVALID'; end if;
 if not exists(select 1 from public.cashier_shifts cs where cs.id=target_shift_id and cs.company_id=target_company_id and cs.branch_id=target_branch_id and cs.store_id=target_store_id and cs.cashier_id=actor_id and cs.status='OPEN') then raise exception 'ACTIVE_SHIFT_REQUIRED'; end if;
 perform i.id from public.inventory i where i.company_id=target_company_id and i.warehouse_id=target_warehouse_id and i.product_id in(select (value->>'productId')::uuid from jsonb_array_elements(cart)) order by i.product_id for update;
 txn:=private.next_sale_number(target_company_id,target_branch_id,'NIA');
 insert into public.sales(id,company_id,store_id,branch_id,warehouse_id,shift_id,cashier_id,transaction_number,status,subtotal,grand_total,idempotency_key)
 values(sale_id,target_company_id,target_store_id,target_branch_id,target_warehouse_id,target_shift_id,actor_id,txn,'PENDING',0,0,target_idempotency_key);
 for line in select value from jsonb_array_elements(cart) loop
  qty:=round((line->>'quantity')::numeric,3); if qty<=0 then raise exception 'INVALID_QUANTITY'; end if;
  select * into product_row from public.products where id=(line->>'productId')::uuid and company_id=target_company_id and status='active';
  if product_row.id is null then raise exception 'PRODUCT_NOT_FOUND'; end if;
  select * into stock from public.inventory where company_id=target_company_id and warehouse_id=target_warehouse_id and product_id=product_row.id for update;
  if stock.id is null or stock.quantity<qty then raise exception 'INSUFFICIENT_STOCK'; end if;
  gross:=round(product_row.selling_price*qty,2); line_discount:=0;
  if coalesce(line->>'discountType','')='PERCENT' then line_discount:=round(gross*least(greatest((line->>'discountValue')::numeric,0),100)/100,2);
  elsif coalesce(line->>'discountType','')='FIXED' then line_discount:=least(gross,greatest((line->>'discountValue')::numeric,0));
  elsif coalesce(line->>'discountType','')<>'' then raise exception 'INVALID_DISCOUNT'; end if;
  line_total:=gross-line_discount; subtotal_value:=subtotal_value+gross; item_discount_value:=item_discount_value+line_discount;
  insert into public.sale_items(sale_id,company_id,product_id,sku,barcode,product_name,unit_price,quantity,discount_type,discount_value,discount_amount,line_subtotal,line_total)
  values(sale_id,target_company_id,product_row.id,product_row.sku,line->>'barcode',product_row.name,product_row.selling_price,qty,nullif(line->>'discountType',''),coalesce((line->>'discountValue')::numeric,0),line_discount,gross,line_total);
 end loop;
 if transaction_discount_type='PERCENT' then txn_discount:=round((subtotal_value-item_discount_value)*least(greatest(coalesce(transaction_discount_value,0),0),100)/100,2);
 elsif transaction_discount_type='FIXED' then txn_discount:=least(subtotal_value-item_discount_value,greatest(coalesce(transaction_discount_value,0),0));
 elsif coalesce(transaction_discount_type,'')<>'' then raise exception 'INVALID_DISCOUNT'; end if;
 tax_value:=round((subtotal_value-item_discount_value-txn_discount)*least(greatest(coalesce(target_tax_rate,0),0),100)/100,2);
 grand_value:=subtotal_value-item_discount_value-txn_discount+tax_value; if grand_value<0 then raise exception 'NEGATIVE_TOTAL'; end if;
 if payment_method not in('CASH','QRIS','BANK_TRANSFER','E_WALLET','OTHER') then raise exception 'INVALID_PAYMENT_METHOD'; end if;
 if payment_method='CASH' then if coalesce(amount_received,0)<grand_value then raise exception 'INSUFFICIENT_PAYMENT'; end if; change_value:=amount_received-grand_value; else amount_received:=grand_value; end if;
 update public.sales set status='PAID',subtotal=subtotal_value,item_discount_total=item_discount_value,transaction_discount=txn_discount,tax_total=tax_value,grand_total=grand_value,completed_at=now(),updated_at=now() where id=sale_id;
 insert into public.payments(sale_id,company_id,store_id,branch_id,method,status,amount,amount_received,change_amount,reference,created_by) values(sale_id,target_company_id,target_store_id,target_branch_id,payment_method,'RECORDED',grand_value,amount_received,change_value,payment_reference,actor_id);
 for line in select value from jsonb_array_elements(cart) order by (value->>'productId')::uuid loop
  qty:=round((line->>'quantity')::numeric,3);
  update public.inventory set quantity=quantity-qty,updated_at=now() where company_id=target_company_id and warehouse_id=target_warehouse_id and product_id=(line->>'productId')::uuid returning * into stock;
  insert into public.inventory_movements(company_id,branch_id,warehouse_id,product_id,movement_type,quantity,balance_after,reference_type,reference_id,actor_user_id,notes) values(target_company_id,target_branch_id,target_warehouse_id,stock.product_id,'SALE',-qty,stock.quantity,'sale',sale_id,actor_id,'POS checkout');
 end loop;
 insert into public.sale_status_history(sale_id,company_id,branch_id,from_status,to_status,actor_user_id) values(sale_id,target_company_id,target_branch_id,'PENDING','PAID',actor_id);
 insert into public.audit_logs(company_id,branch_id,actor_user_id,action,resource_type,resource_id,metadata) values(target_company_id,target_branch_id,actor_id,'sale.completed','sale',sale_id,jsonb_build_object('transaction_number',txn,'grand_total',grand_value));
 if item_discount_value+txn_discount>0 then insert into public.audit_logs(company_id,branch_id,actor_user_id,action,resource_type,resource_id,metadata) values(target_company_id,target_branch_id,actor_id,'discount.applied','sale',sale_id,jsonb_build_object('amount',item_discount_value+txn_discount)); end if;
 return sale_id;
exception when unique_violation then select id into existing_sale from public.sales where company_id=target_company_id and idempotency_key=target_idempotency_key; if existing_sale is not null then return existing_sale; end if; raise;
end; $$;

revoke all on function public.open_cashier_shift(uuid,uuid,uuid,uuid,numeric) from public,anon,authenticated;
revoke all on function public.close_cashier_shift(uuid,uuid,uuid,numeric) from public,anon,authenticated;
revoke all on function public.checkout_sale(uuid,uuid,uuid,uuid,uuid,uuid,text,jsonb,text,numeric,numeric,text,numeric,text) from public,anon,authenticated;
revoke all on function public.cancel_sale(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.refund_sale(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.open_cashier_shift(uuid,uuid,uuid,uuid,numeric) to service_role;
grant execute on function public.close_cashier_shift(uuid,uuid,uuid,numeric) to service_role;
grant execute on function public.checkout_sale(uuid,uuid,uuid,uuid,uuid,uuid,text,jsonb,text,numeric,numeric,text,numeric,text) to service_role;
grant execute on function public.cancel_sale(uuid,uuid,uuid,text) to service_role;
grant execute on function public.refund_sale(uuid,uuid,uuid,text,jsonb) to service_role;

insert into public.permissions(permission_key,display_name) values
('pos.access','Access POS'),('pos.checkout','Checkout sales'),('pos.discount','Apply POS discounts'),('sale.read','Read sales'),('sale.cancel','Cancel sales'),('sale.refund','Refund sales'),('payment.read','Read payments'),('shift.open','Open cashier shift'),('shift.read','Read cashier shifts'),('shift.close','Close cashier shift')
on conflict(permission_key) do update set display_name=excluded.display_name;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.permission_key in('pos.access','pos.checkout','pos.discount','sale.read','sale.cancel','sale.refund','payment.read','shift.open','shift.read','shift.close') where r.scope='company' and r.role_key in('owner','company_admin') on conflict do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.permission_key in('pos.access','pos.checkout','sale.read','payment.read','shift.open','shift.read','shift.close') where r.scope='branch' and r.role_key='cashier' on conflict do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.permission_key in('pos.access','pos.checkout','pos.discount','sale.read','sale.cancel','sale.refund','payment.read','shift.open','shift.read','shift.close') where r.scope='branch' and r.role_key in('manager','supervisor') on conflict do nothing;

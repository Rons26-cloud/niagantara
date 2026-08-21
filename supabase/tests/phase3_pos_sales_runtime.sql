-- Run against a disposable local database after all migrations.
begin;
do $$ begin
  if exists(select 1 from pg_class where relnamespace='public'::regnamespace and relname in('cashier_shifts','sales','sale_items','payments','sale_status_history','refunds','refund_items') and not relrowsecurity) then raise exception 'PHASE3_RLS_DISABLED'; end if;
  if has_function_privilege('authenticated','public.checkout_sale(uuid,uuid,uuid,uuid,uuid,uuid,text,jsonb,text,numeric,numeric,text,numeric,text)','EXECUTE') then raise exception 'CHECKOUT_RPC_EXPOSED'; end if;
  if not has_function_privilege('service_role','public.checkout_sale(uuid,uuid,uuid,uuid,uuid,uuid,text,jsonb,text,numeric,numeric,text,numeric,text)','EXECUTE') then raise exception 'SERVICE_ROLE_CHECKOUT_MISSING'; end if;
  if not exists(select 1 from pg_indexes where schemaname='public' and indexname='cashier_shifts_one_open_idx') then raise exception 'SHIFT_UNIQUENESS_MISSING'; end if;
  if not exists(select 1 from pg_constraint where conrelid='public.sales'::regclass and contype='u' and pg_get_constraintdef(oid) like '%idempotency_key%') then raise exception 'CHECKOUT_IDEMPOTENCY_MISSING'; end if;
end $$;
rollback;

-- Expected drawer cash uses the sale amount (already net of change) and refunds.
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

revoke all on function public.close_cashier_shift(uuid,uuid,uuid,numeric) from public,anon,authenticated;
grant execute on function public.close_cashier_shift(uuid,uuid,uuid,numeric) to service_role;

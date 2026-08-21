-- Correct an ambiguous PL/pgSQL variable in the Phase 3 transaction counter.
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

revoke all on function private.next_sale_number(uuid,uuid,text) from public,anon,authenticated;
grant execute on function private.next_sale_number(uuid,uuid,text) to service_role;

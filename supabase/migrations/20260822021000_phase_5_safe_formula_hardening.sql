-- Phase 5 defense in depth: block network-capable formulas at the database boundary.
do $$
declare constraint_name text;
begin
 select c.conname into constraint_name
 from pg_constraint c
 where c.conrelid='public.sheet_columns'::regclass and c.contype='c'
   and pg_get_constraintdef(c.oid) ilike '%IMPORTRANGE%';
 if constraint_name is not null then
  execute format('alter table public.sheet_columns drop constraint %I',constraint_name);
 end if;
end $$;
alter table public.sheet_columns add constraint sheet_columns_formula_safe_check
check(formula_template is null or (
 length(formula_template)<=500 and formula_template ~ '^='
 and formula_template !~* '(IMPORTRANGE|IMPORTXML|IMPORTHTML|IMPORTDATA|GOOGLEFINANCE|HYPERLINK|WEBSERVICE)'
));

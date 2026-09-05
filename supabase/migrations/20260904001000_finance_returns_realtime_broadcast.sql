-- Complete tenant-scoped realtime coverage for returns and receivable/payable changes.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['refunds', 'refund_items', 'payables', 'receivables', 'financial_transactions'] loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_realtime_broadcast', table_name);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.broadcast_business_change()',
      table_name || '_realtime_broadcast', table_name
    );
  end loop;
end;
$$;

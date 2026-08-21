-- Allow multiple legitimate partial payment events per payable/receivable.
-- company_id + idempotency_key remains the authoritative duplicate-request guard.
alter table public.financial_transactions
  drop constraint financial_transactions_company_id_source_type_source_id_eve_key;
create index financial_transactions_source_idx
  on public.financial_transactions(company_id,source_type,source_id,event_type,occurred_at desc);

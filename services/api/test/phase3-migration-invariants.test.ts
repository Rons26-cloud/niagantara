import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const sql = readFileSync(
  new URL(
    '../../../supabase/migrations/20260821135954_phase_3_pos_sales_foundation.sql',
    import.meta.url,
  ),
  'utf8',
);
test('all Phase 3 transactional tables enable RLS', () => {
  for (const table of [
    'cashier_shifts',
    'sales',
    'sale_items',
    'payments',
    'sale_status_history',
    'refunds',
    'refund_items',
  ])
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table} enable row level security`),
    );
});
test('checkout is server-only, idempotent and locks inventory', () => {
  assert.match(sql, /unique\(company_id,idempotency_key\)/);
  assert.match(sql, /order by i\.product_id for update/);
  assert.match(
    sql,
    /revoke all on function public\.checkout_sale[\s\S]*from public,anon,authenticated/,
  );
  assert.match(
    sql,
    /grant execute on function public\.checkout_sale[\s\S]*to service_role/,
  );
});
test('checkout calculates authoritative price and creates SALE movement atomically', () => {
  assert.match(sql, /gross:=round\(product_row\.selling_price\*qty,2\)/);
  assert.match(sql, /'SALE',-qty/);
  assert.match(
    sql,
    /if stock\.id is null or stock\.quantity<qty then raise exception 'INSUFFICIENT_STOCK'/,
  );
});
test('transaction numbers use atomic branch-date counters', () => {
  assert.match(sql, /primary key\(company_id,branch_id,business_date\)/);
  assert.match(
    sql,
    /on conflict\(company_id,branch_id,business_date\) do update/,
  );
});
test('cancel and refund preserve history with compensating RETURN movements', () => {
  assert.match(sql, /create or replace function public\.cancel_sale/);
  assert.match(sql, /create or replace function public\.refund_sale/);
  assert.match(sql, /'RETURN',item\.quantity/);
  assert.match(sql, /'RETURN',qty/);
  assert.doesNotMatch(sql, /delete from public\.(sales|inventory_movements)/);
});

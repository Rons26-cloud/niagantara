import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { InventoryService } from '../src/modules/inventory/inventory.service.js';
import { PurchasesService } from '../src/modules/purchases/purchases.service.js';
import { SuppliersService } from '../src/modules/suppliers/suppliers.service.js';

const phase2 = readFileSync(new URL('../../../supabase/migrations/20260821003049_phase_2_product_inventory_foundation.sql', import.meta.url), 'utf8');
const phase4 = readFileSync(new URL('../../../supabase/migrations/20260822010000_phase_4_business_operations.sql', import.meta.url), 'utf8');
const adjustment = { branchId: 'branch-a', warehouseId: 'warehouse-a', productId: 'product-a', quantityDelta: 2, minimumStock: 1, reason: 'CORRECTION' as const };

function inventoryService(result: any = { id: 'inventory-a', quantity: 7 }) {
  const auditCalls: any[] = [];
  const repo: any = {
    list: async () => ({ data: [{ quantity: 0, minimum_stock: 1 }, { quantity: 1, minimum_stock: 1 }, { quantity: 5, minimum_stock: 1 }], error: null }),
    movements: async () => ({ data: [], error: null }),
    adjust: async () => ({ data: result, error: null }),
    transferScopes: async () => ({ data: [{ branch_id: 'branch-a' }, { branch_id: 'branch-b' }], error: null }),
    transfer: async () => ({ data: 'transfer-a', error: null }),
  };
  const audit: any = { record: async (value: any) => { auditCalls.push(value); } };
  return { service: new InventoryService(repo, audit), auditCalls };
}

test('authorized branch inventory read remains bounded to allowed branches', async () => {
  let allowed: string[] | undefined;
  const repo: any = { list: async (_c: string, _q: unknown, a?: string[]) => { allowed = a; return { data: [], error: null }; } };
  await new InventoryService(repo, {} as any).list('company-a', {}, ['branch-a']);
  assert.deepEqual(allowed, ['branch-a']);
});
test('unauthorized branch inventory read is denied', async () => await assert.rejects(() => inventoryService().service.list('company-a', { branchId: 'branch-b' }, ['branch-a']), /Branch is outside/));
test('inventory status filters distinguish low and out of stock', async () => {
  const s = inventoryService().service;
  assert.equal((await s.list('company-a', { status: 'LOW_STOCK' })).length, 1);
  assert.equal((await s.list('company-a', { status: 'OUT_OF_STOCK' })).length, 1);
});
test('cross-branch adjustment is denied before repository mutation', async () => await assert.rejects(() => inventoryService().service.adjust('user-a', 'company-a', 'branch-b', adjustment), /Adjustment branch/));
for (const quantity of [0, Number.NaN, Number.POSITIVE_INFINITY]) {
  test(`invalid adjustment quantity ${String(quantity)} is rejected`, async () => await assert.rejects(() => inventoryService().service.adjust('user-a', 'company-a', 'branch-a', { ...adjustment, quantityDelta: quantity }), /Quantity delta/));
}
test('invalid adjustment reason is rejected', async () => await assert.rejects(() => inventoryService().service.adjust('user-a', 'company-a', 'branch-a', { ...adjustment, reason: 'SALE' as any }), /valid adjustment reason/));
test('successful adjustment records previous and resulting quantities', async () => {
  const { service, auditCalls } = inventoryService();
  await service.adjust('user-a', 'company-a', 'branch-a', adjustment);
  assert.deepEqual(auditCalls[0].metadata, { reason: 'CORRECTION', quantityDelta: 2, previousQuantity: 5, resultingQuantity: 7, warehouseId: 'warehouse-a', productId: 'product-a' });
});
test('branch-scoped purchase list cannot omit scope', async () => {
  let allowed: string[] | undefined;
  const repo: any = { list: async (_c: string, _q: unknown, a?: string[]) => { allowed = a; return { data: [], error: null }; } };
  await new PurchasesService(repo).list('company-a', {}, ['branch-a']);
  assert.deepEqual(allowed, ['branch-a']);
});
test('unauthorized purchase branch filter is denied', async () => await assert.rejects(() => new PurchasesService({} as any).list('company-a', { branchId: 'branch-b' }, ['branch-a']), /outside your scope/));
test('purchase rejects non-finite quantity and cost', async () => {
  const service = new PurchasesService({} as any);
  const base: any = { storeId: 'store-a', branchId: 'branch-a', warehouseId: 'warehouse-a', supplierId: 'supplier-a', purchaseDate: '2026-08-28' };
  await assert.rejects(() => service.create('user-a', 'company-a', 'branch-a', { ...base, items: [{ productId: 'product-a', quantity: Infinity, unitCost: 1 }] }), /Positive quantity/);
  await assert.rejects(() => service.create('user-a', 'company-a', 'branch-a', { ...base, items: [{ productId: 'product-a', quantity: 1, unitCost: NaN }] }), /Positive quantity/);
});
test('purchase receipt rejects non-finite and duplicate lines', async () => {
  const service = new PurchasesService({} as any);
  await assert.rejects(() => service.receive('u', 'c', 'b', 'p', { idempotencyKey: 'idem', items: [{ purchaseItemId: 'i', quantity: Infinity }] }), /positive receipt/);
  await assert.rejects(() => service.receive('u', 'c', 'b', 'p', { idempotencyKey: 'idem', items: [{ purchaseItemId: 'i', quantity: 1 }, { purchaseItemId: 'i', quantity: 1 }] }), /only once/);
});
test('legitimate receiving forwards one server-authoritative RPC call', async () => {
  let calls = 0;
  const repo: any = { get: async () => ({ data: { id: 'purchase-a', branch_id: 'branch-a' }, error: null }), receive: async () => { calls += 1; return { data: 'receipt-a', error: null }; } };
  const result = await new PurchasesService(repo).receive('u', 'c', 'branch-a', 'purchase-a', { idempotencyKey: 'idem', items: [{ purchaseItemId: 'item-a', quantity: 1 }] }, ['branch-a']);
  assert.equal(result.receiptId, 'receipt-a');
  assert.equal(calls, 1);
});
test('supplier detail is tenant scoped and missing foreign supplier is hidden', async () => {
  const service = new SuppliersService({ get: async (company: string) => ({ data: company === 'company-a' ? null : { id: 'supplier-a' }, error: null }) } as any, {} as any);
  await assert.rejects(() => service.get('company-a', 'supplier-a'), /Supplier not found/);
});
test('supplier runtime validation rejects invalid status and email', async () => {
  const service = new SuppliersService({} as any, {} as any);
  await assert.rejects(() => service.create('u', 'c', { supplierCode: 'S1', name: 'Supplier', status: 'deleted' as any }), /status is invalid/);
  await assert.rejects(() => service.create('u', 'c', { supplierCode: 'S1', name: 'Supplier', email: 'invalid' }), /email is invalid/);
});
test('receiving is transactional, row-locked, idempotent and ledger-backed', () => {
  assert.match(phase4, /create or replace function public\.receive_purchase[\s\S]+for update/);
  assert.match(phase4, /unique\(company_id,idempotency_key\)/);
  assert.match(phase4, /on conflict\(warehouse_id,product_id\) do update set quantity/);
  assert.match(phase4, /insert into public\.inventory_movements[\s\S]+purchase_receipt/);
  assert.match(phase4, /RECEIVE_EXCEEDS_ORDERED/);
});
test('inventory mutations prevent negative stock and RPCs are not frontend executable', () => {
  assert.match(phase2, /if stock\.quantity\+quantity_delta<0 then raise exception 'NEGATIVE_STOCK'/);
  assert.match(phase2, /revoke all on function public\.adjust_inventory[\s\S]+from public,anon/);
  assert.match(phase4, /revoke all on function public\.receive_purchase[\s\S]+from public,anon,authenticated/);
});
test('supplier, purchase and inventory tables retain RLS', () => {
  assert.match(phase2, /alter table public\.inventory enable row level security/);
  assert.match(phase4, /foreach t in array array\['suppliers'[\s\S]+'purchases'/);
});
test('transfer remains atomic and same-company but has no unsupported lifecycle claim', () => {
  assert.match(phase2, /create or replace function public\.transfer_inventory[\s\S]+for update/);
  assert.match(phase2, /company_id=target_company_id/);
  assert.doesNotMatch(phase2 + phase4, /create table public\.stock_transfers/);
});

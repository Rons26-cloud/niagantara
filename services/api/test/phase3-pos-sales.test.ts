import assert from 'node:assert/strict';
import test from 'node:test';
import { PosService } from '../src/modules/pos/pos.service.js';
import { SalesService } from '../src/modules/sales/sales.service.js';
import { ShiftsService } from '../src/modules/shifts/shifts.service.js';
test('POS barcode lookup returns safe PRODUCT_NOT_FOUND', async () => {
  const service = new PosService({
    barcode: async () => ({ data: null, error: null }),
  } as any);
  await assert.rejects(
    () => service.barcode('c', 'b', 'w', 'unknown'),
    (e: any) => e.response.code === 'PRODUCT_NOT_FOUND',
  );
});
test('POS checkout rejects invalid quantities before RPC', async () => {
  const service = new PosService({} as any);
  await assert.rejects(
    () =>
      service.checkout(
        'u',
        'c',
        'b',
        { branchId: 'b', items: [{ productId: 'p', quantity: 0 }] } as any,
        ['pos.checkout'],
      ),
    (e: any) => e.response.code === 'INVALID_CART',
  );
});
test('POS discounts require pos.discount permission', async () => {
  const service = new PosService({} as any);
  await assert.rejects(
    () =>
      service.checkout(
        'u',
        'c',
        'b',
        {
          branchId: 'b',
          items: [
            {
              productId: 'p',
              quantity: 1,
              discountType: 'FIXED',
              discountValue: 1,
            },
          ],
        } as any,
        ['pos.checkout'],
      ),
    (e: any) => e.response.code === 'DISCOUNT_ACCESS_DENIED',
  );
});
test('checkout forwards identity and cart but no frontend totals or price', async () => {
  let input: any;
  const service = new PosService({
    checkout: async (c: string, u: string, d: any) => {
      input = { c, u, d };
      return { data: 'sale-1', error: null };
    },
  } as any);
  const result = await service.checkout(
    'actor',
    'company',
    'b',
    {
      storeId: 's',
      branchId: 'b',
      warehouseId: 'w',
      shiftId: 'sh',
      idempotencyKey: 'request-123',
      items: [{ productId: 'p', quantity: 1 }],
      paymentMethod: 'CASH',
      amountReceived: 100,
    } as any,
    ['pos.checkout'],
  );
  assert.equal(result.saleId, 'sale-1');
  assert.equal(input.d.items[0].unitPrice, undefined);
  assert.equal(input.d.grandTotal, undefined);
});
test('sale branch isolation rejects an unauthorized filter', async () => {
  const service = new SalesService({} as any);
  await assert.rejects(
    () => service.list('c', { branchId: 'foreign' }, ['allowed']),
    (e: any) => e.response.code === 'BRANCH_ACCESS_DENIED',
  );
});
test('refund requires reason and at least one item', async () => {
  const service = new SalesService({} as any);
  await assert.rejects(
    () => service.refund('c', 'u', 'sale', { reason: 'x', items: [] }),
    (e: any) => e.response.code === 'INVALID_REFUND',
  );
});
test('shift open rejects negative opening cash', async () => {
  const service = new ShiftsService({} as any);
  await assert.rejects(
    () =>
      service.open('c', 'u', { storeId: 's', branchId: 'b', openingCash: -1 }),
    (e: any) => e.response.code === 'INVALID_OPENING_CASH',
  );
});

test('shift listing rejects a branch outside the authorized scope', async () => {
  let called = false;
  const service = new ShiftsService({
    list: async () => {
      called = true;
      return { data: [], error: null };
    },
  } as never);
  await assert.rejects(
    () => service.list('company', 'branch-b', undefined, ['branch-a']),
    /outside your scope/,
  );
  assert.equal(called, false);
});

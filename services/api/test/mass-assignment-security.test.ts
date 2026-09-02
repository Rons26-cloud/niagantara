import assert from 'node:assert/strict';
import test from 'node:test';
import { ValidationPipe } from '@nestjs/common';
import { UpdateBranchDto } from '../src/modules/branches/dto/branch.dto.js';
import { UpdateStoreDto } from '../src/modules/stores/dto/store.dto.js';
import { PurchasesService } from '../src/modules/purchases/purchases.service.js';
import { ShiftsService } from '../src/modules/shifts/shifts.service.js';
import { WarehousesService } from '../src/modules/warehouses/warehouses.service.js';

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

function rejectsWithValidationMessage(expected: RegExp) {
  return (error: unknown) => {
    const response = (
      error as { getResponse?: () => unknown }
    ).getResponse?.() as { message?: string[] } | undefined;
    return (
      Array.isArray(response?.message) &&
      response.message.some((message) => expected.test(message))
    );
  };
}

test('store update rejects tenant and identity fields supplied by a client', async () => {
  await assert.rejects(
    pipe.transform(
      {
        name: 'Safe store',
        company_id: '00000000-0000-0000-0000-000000000002',
        id: 'attacker-id',
      },
      { type: 'body', metatype: UpdateStoreDto },
    ),
    rejectsWithValidationMessage(/property (company_id|id) should not exist/),
  );
});

test('branch update rejects relationship reassignment and invalid status', async () => {
  await assert.rejects(
    pipe.transform(
      { name: 'Safe branch', store_id: '00000000-0000-0000-0000-000000000002' },
      { type: 'body', metatype: UpdateBranchDto },
    ),
    rejectsWithValidationMessage(/property store_id should not exist/),
  );
  await assert.rejects(
    pipe.transform(
      { status: 'owner' },
      { type: 'body', metatype: UpdateBranchDto },
    ),
    rejectsWithValidationMessage(/status must be one of the following values/),
  );
});

test('purchase mutation cannot use one branch permission against another branch record', async () => {
  let mutated = false;
  const service = new PurchasesService({
    get: async () => ({ data: null, error: null }),
    receive: async () => {
      mutated = true;
      return { data: 'receipt', error: null };
    },
  } as never);
  await assert.rejects(
    service.receive(
      'user',
      'company',
      'authorized-branch',
      'foreign-purchase',
      {
        idempotencyKey: 'safe-key',
        items: [{ purchaseItemId: 'item', quantity: 1 }],
      },
    ),
    /Purchase not found/,
  );
  assert.equal(mutated, false);
});

test('shift close checks the authorized branch before calling its privileged RPC', async () => {
  let mutated = false;
  const service = new ShiftsService({
    get: async () => ({ data: null, error: null }),
    close: async () => {
      mutated = true;
      return { data: {}, error: null };
    },
  } as never);
  await assert.rejects(
    service.close('company', 'user', 'authorized-branch', 'foreign-shift', 100),
    /Shift not found/,
  );
  assert.equal(mutated, false);
});

test('warehouse update cannot target a warehouse outside the authorized branch', async () => {
  let mutated = false;
  const service = new WarehousesService(
    {
      get: async () => ({
        data: { id: 'warehouse', branch_id: 'branch-b' },
        error: null,
      }),
      update: async () => {
        mutated = true;
        return { data: {}, error: null };
      },
    } as never,
    {} as never,
  );
  await assert.rejects(
    service.update('user', 'company', 'warehouse', { name: 'tampered' }, [
      'branch-a',
    ]),
    /outside your scope/,
  );
  assert.equal(mutated, false);
});

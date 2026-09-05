import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from '../src/modules/users/users.service.js';

const companyId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const branchId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function atomicFailureRepo(errorCode: string, calls: string[]) {
  return {
    get: async () => ({
      data: {
        id: 'membership',
        user_id: userId,
        role_key: 'staff',
        status: 'active',
      },
      error: null,
    }),
    companyRole: async () => ({
      data: { role_key: 'company_admin' },
      error: null,
    }),
    branches: async () => ({ data: [{ id: branchId }], error: null }),
    branchRoles: async () => ({ data: [{ role_key: 'manager' }], error: null }),
    existingBranches: async () => ({
      data: [{ branch_id: branchId, role_key: 'manager' }],
      error: null,
    }),
    updateAccessAtomic: async () => {
      calls.push(`rpc:${errorCode}`);
      return { data: null, error: { message: errorCode } };
    },
    updateCompanyMembership: async () => calls.push('direct:membership'),
    upsertBranches: async () => calls.push('direct:branches'),
  };
}

for (const [errorCode, expectedError] of [
  ['BRANCH_ACCESS_DENIED', BadRequestException],
  ['AUDIT_WRITE_FAILED', InternalServerErrorException],
] as const) {
  test(`atomic access RPC rollback boundary leaves state unchanged when ${errorCode}`, async () => {
    const calls: string[] = [];
    const state = {
      role_key: 'staff',
      status: 'active',
      branches: ['branch-a'],
    };
    const service = new UsersService(
      atomicFailureRepo(errorCode, calls) as any,
      { record: async () => calls.push('direct:audit') } as any,
    );
    await assert.rejects(
      () =>
        service.update(
          { id: userId, companyRole: 'owner' },
          companyId,
          userId,
          {
            roleKey: 'company_admin',
            branches: [{ branchId, roleKey: 'manager' }],
          },
        ),
      expectedError,
    );
    assert.deepEqual(state, {
      role_key: 'staff',
      status: 'active',
      branches: ['branch-a'],
    });
    assert.deepEqual(calls, [`rpc:${errorCode}`]);
  });
}

test('transaction migration locks owners and performs audit in the same RPC', () => {
  const migration = readFileSync(
    new URL(
      '../../../supabase/migrations/20260905021752_transactional_access_management.sql',
      import.meta.url,
    ),
    'utf8',
  );
  assert.match(migration, /perform 1[\s\S]*company_members[\s\S]*for update/);
  assert.match(
    migration,
    /public\.companies[\s\S]*target_company_id[\s\S]*for update/,
  );
  assert.match(migration, /insert into public\.audit_logs/);
  assert.match(
    migration,
    /revoke all on function public\.update_company_user_access/,
  );
  assert.match(
    migration,
    /revoke all on function public\.revoke_cashier_access/,
  );
  assert.match(
    migration,
    /grant execute on function public\.update_company_user_access[\s\S]*to service_role/,
  );
});

test('transaction migration is additive and server-only', () => {
  const migration = readFileSync(
    new URL(
      '../../../supabase/migrations/20260905021752_transactional_access_management.sql',
      import.meta.url,
    ),
    'utf8',
  );
  assert.doesNotMatch(migration, /drop\s+(table|schema)|truncate\s+/i);
  assert.doesNotMatch(
    migration,
    /grant execute on function[\s\S]*to (anon|authenticated)/i,
  );
});

test('unknown RPC failures map to a generic server error', async () => {
  const service = new UsersService(
    {
      get: async () => ({
        data: { id: 'm1', role_key: 'staff', status: 'active' },
        error: null,
      }),
      updateAccessAtomic: async () => ({
        error: { message: 'syntax error at or near "secret_table"' },
      }),
    } as any,
    {} as any,
  );
  await assert.rejects(
    () =>
      service.update(
        { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', companyRole: 'owner' },
        companyId,
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        {},
      ),
    InternalServerErrorException,
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthService } from '../src/modules/auth/auth.service.js';

function queryResult(data: unknown) {
  let rows = Array.isArray(data) ? data : data == null ? [] : [data];
  const query: any = {
    select: () => query,
    eq: (field: string, value: unknown) => {
      rows = rows.filter((row: any) => row[field] === value);
      return query;
    },
    in: (field: string, values: unknown[]) => {
      rows = rows.filter((row: any) => values.includes(row[field]));
      return query;
    },
    maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
    then: (resolve: (value: unknown) => void) =>
      resolve({
        data: Array.isArray(data) ? rows : (rows[0] ?? null),
        error: null,
      }),
  };
  return query;
}

test('auth/me returns owner permissions and accessible active branches', async () => {
  const tables: Record<string, unknown> = {
    profiles: { id: 'u1', status: 'active' },
    company_members: [
      { company_id: 'c1', user_id: 'u1', role_key: 'owner', status: 'active' },
    ],
    branch_members: [],
    roles: [{ id: 'r1', scope: 'company', role_key: 'owner' }],
    role_permissions: [
      { role_id: 'r1', permission: { permission_key: 'company.read' } },
      { role_id: 'r1', permission: { permission_key: 'branch.manage' } },
    ],
    stores: [
      { id: 's1', company_id: 'c1', name: 'Main' },
      { id: 's2', company_id: 'c2', name: 'Foreign' },
    ],
    branches: [
      {
        id: 'b1',
        company_id: 'c1',
        store_id: 's1',
        name: 'Main',
        code: 'MAIN',
        status: 'active',
      },
      {
        id: 'b2',
        company_id: 'c2',
        store_id: 's2',
        name: 'Foreign',
        code: 'FOREIGN',
        status: 'active',
      },
      {
        id: 'b3',
        company_id: 'c1',
        store_id: 's1',
        name: 'Inactive',
        code: 'INACTIVE',
        status: 'inactive',
      },
    ],
  };
  const client = { from: (table: string) => queryResult(tables[table]) };
  const result = await new AuthService({ client } as any).me('u1');
  assert.deepEqual(result.roles, ['owner']);
  assert.deepEqual(result.permissions, ['branch.manage', 'company.read']);
  assert.equal(result.accessible_branches.length, 1);
  assert.equal(result.stores.length, 1);
  assert.equal(
    (result.accessible_branches[0] as { company_id: string }).company_id,
    'c1',
  );
  assert.equal(result.active_company, 'c1');
});

test('branch-scoped employee receives no company-wide branches without an explicit assignment', async () => {
  const tables: Record<string, unknown> = {
    profiles: { id: 'u2', status: 'active' },
    company_members: [
      {
        company_id: 'c1',
        user_id: 'u2',
        role_key: 'employee',
        status: 'active',
      },
    ],
    branch_members: [],
    roles: [{ id: 'r2', scope: 'company', role_key: 'employee' }],
    role_permissions: [],
    stores: [{ id: 's1', company_id: 'c1', name: 'Main' }],
    branches: [
      {
        id: 'b1',
        company_id: 'c1',
        store_id: 's1',
        name: 'Main',
        code: 'MAIN',
        status: 'active',
      },
    ],
  };
  const client = { from: (table: string) => queryResult(tables[table]) };
  const result = await new AuthService({ client } as any).me('u2');
  assert.deepEqual(result.roles, ['employee']);
  assert.deepEqual(result.accessible_branches, []);
});

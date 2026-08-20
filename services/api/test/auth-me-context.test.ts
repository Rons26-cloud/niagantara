import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthService } from '../src/modules/auth/auth.service.js';

function queryResult(data: unknown) {
  const query: any = {
    select: () => query,
    eq: () => query,
    in: () => query,
    maybeSingle: async () => ({ data, error: null }),
    then: (resolve: (value: unknown) => void) => resolve({ data, error: null }),
  };
  return query;
}

test('auth/me returns owner permissions and accessible active branches', async () => {
  const tables: Record<string, unknown> = {
    profiles: { id: 'u1', status: 'active' },
    company_members: [{ company_id: 'c1', role_key: 'owner', status: 'active' }],
    roles: [{ id: 'r1', role_key: 'owner' }],
    role_permissions: [
      { permission: { permission_key: 'company.read' } },
      { permission: { permission_key: 'branch.manage' } },
    ],
    branches: [{ id: 'b1', company_id: 'c1', store_id: 's1', name: 'Main', code: 'MAIN', status: 'active' }],
  };
  const client = { from: (table: string) => queryResult(tables[table]) };
  const result = await new AuthService({ client } as any).me('u1');
  assert.deepEqual(result.roles, ['owner']);
  assert.deepEqual(result.permissions, ['branch.manage', 'company.read']);
  assert.equal(result.accessible_branches.length, 1);
  assert.equal(result.active_company, 'c1');
});

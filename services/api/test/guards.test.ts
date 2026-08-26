import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../src/common/guards/auth.guard.js';
import { BranchGuard } from '../src/common/guards/branch.guard.js';
import { MasterGuard } from '../src/common/guards/master.guard.js';
import { PermissionGuard } from '../src/common/guards/permission.guard.js';
import { TenantGuard } from '../src/common/guards/tenant.guard.js';

function context(request: any) {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
}

function chain(result: { data?: any; error?: any }) {
  const query: any = {};
  for (const method of ['select', 'eq', 'in']) query[method] = () => query;
  query.maybeSingle = async () => result;
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return query;
}

test('TenantGuard derives branch permissions only from the selected branch', async () => {
  const roleLookups: string[][] = [];
  const client = {
    from: (table: string) => {
      if (table === 'company_members') return chain({ data: { role_key: 'finance' }, error: null });
      if (table === 'branch_members') return chain({ data: [
        { branch_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', role_key: 'cashier' },
        { branch_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', role_key: 'manager' },
      ], error: null });
      if (table === 'roles') {
        const query = chain({ data: [], error: null });
        query.in = (_column: string, values: string[]) => {
          roleLookups.push(values);
          return chain({ data: [], error: null });
        };
        return query;
      }
      return chain({ data: [], error: null });
    },
  };
  const request: any = {
    headers: {
      'x-company-id': 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'x-branch-id': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    },
    params: {},
    user: { id: 'u1' },
  };
  const guard = new TenantGuard({ client } as any);
  assert.equal(await guard.canActivate(context(request)), true);
  assert.deepEqual(roleLookups, [['cashier']]);
});

test('TenantGuard rejects an owner branch outside the active company', async () => {
  const client = {
    from: (table: string) => {
      if (table === 'company_members') return chain({ data: { role_key: 'owner' }, error: null });
      if (table === 'branch_members') return chain({ data: [], error: null });
      if (table === 'branches') return chain({ data: null, error: null });
      return chain({ data: [], error: null });
    },
  };
  const guard = new TenantGuard({ client } as any);
  await assert.rejects(
    () => guard.canActivate(context({
      headers: {
        'x-company-id': 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        'x-branch-id': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      params: {},
      user: { id: 'owner-a' },
    })),
    ForbiddenException,
  );
});

test('AuthGuard rejects a missing bearer token', async () => {
  const guard = new AuthGuard({ client: { auth: { getUser: async () => ({ data: {}, error: null }) } } } as any);
  await assert.rejects(() => guard.canActivate(context({ headers: {} })), UnauthorizedException);
});

test('AuthGuard trusts platform role only from app_metadata', async () => {
  const request: any = { headers: { authorization: 'Bearer valid' } };
  const guard = new AuthGuard({ client: { auth: { getUser: async () => ({ data: { user: { id: 'u1', app_metadata: { platform_role: 'master_admin' }, user_metadata: { platform_role: 'super_master' } } }, error: null }) } } } as any);
  assert.equal(await guard.canActivate(context(request)), true);
  assert.equal(request.authz.platformRole, 'master_admin');
});

test('TenantGuard rejects a foreign membership', async () => {
  const guard = new TenantGuard({ client: { from: () => chain({ data: null, error: null }) } } as any);
  await assert.rejects(() => guard.canActivate(context({ headers: { 'x-company-id': 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' }, params: {}, user: { id: 'owner-a' } })), ForbiddenException);
});

test('TenantGuard rejects a non-UUID company id', async () => {
  const guard = new TenantGuard({ client: { from: () => chain({ data: null, error: null }) } } as any);
  await assert.rejects(() => guard.canActivate(context({ headers: { 'x-company-id': 'not-a-uuid' }, params: {}, user: { id: 'u1' } })));
});

test('PermissionGuard enforces the declared permission', () => {
  const guard = new PermissionGuard({ getAllAndOverride: () => 'store.manage' } as any);
  assert.throws(() => guard.canActivate(context({ authz: { permissions: ['store.read'] } })), ForbiddenException);
  assert.equal(guard.canActivate(context({ authz: { permissions: ['store.manage'] } })), true);
});

test('MasterGuard rejects an ordinary company owner', () => {
  const guard = new MasterGuard();
  assert.throws(() => guard.canActivate(context({ authz: { companyRole: 'owner', platformRole: null } })), ForbiddenException);
  assert.equal(guard.canActivate(context({ authz: { platformRole: 'auditor' } })), true);
});

test('BranchGuard verifies branch ownership by active company', async () => {
  const guard = new BranchGuard({ client: { from: () => chain({ data: { id: 'branch-b', company_id: 'company-b' }, error: null }) } } as any);
  await assert.rejects(() => guard.canActivate(context({ params: { id: 'branch-b' }, headers: {}, tenant: { companyId: 'company-a' } })), ForbiddenException);
});

test('TenantGuard rejects a non-UUID x-branch-id', async () => {
  const guard = new TenantGuard({ client: { from: () => chain({ data: { role_key: 'owner' }, error: null }) } } as any);
  await assert.rejects(
    () => guard.canActivate(context({
      headers: { 'x-company-id': 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'x-branch-id': 'not-a-uuid' },
      params: {},
      user: { id: 'u1' },
    })),
  );
});

test('TenantGuard allows company_admin to access a branch without direct membership', async () => {
  let branchLookup = false;
  const client = {
    from: (table: string) => {
      if (table === 'company_members') return chain({ data: { role_key: 'company_admin' }, error: null });
      if (table === 'branch_members') return chain({ data: [], error: null });
      if (table === 'branches') { branchLookup = true; return chain({ data: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }, error: null }); }
      return chain({ data: [], error: null });
    },
  };
  const guard = new TenantGuard({ client } as any);
  assert.equal(await guard.canActivate(context({
    headers: { 'x-company-id': 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'x-branch-id': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
    params: {},
    user: { id: 'admin-1' },
  })), true);
  assert.equal(branchLookup, true);
});

test('TenantGuard does not derive branch permissions for owner without branch membership', async () => {
  const roleLookups: string[][] = [];
  const client = {
    from: (table: string) => {
      if (table === 'company_members') return chain({ data: { role_key: 'owner' }, error: null });
      if (table === 'branch_members') return chain({ data: [], error: null });
      if (table === 'branches') return chain({ data: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }, error: null });
      if (table === 'roles') {
        const query = chain({ data: [], error: null });
        query.in = (_column: string, values: string[]) => { roleLookups.push(values); return chain({ data: [], error: null }); };
        return query;
      }
      return chain({ data: [], error: null });
    },
  };
  const guard = new TenantGuard({ client } as any);
  assert.equal(await guard.canActivate(context({
    headers: { 'x-company-id': 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'x-branch-id': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
    params: {},
    user: { id: 'owner-1' },
  })), true);
  assert.equal(roleLookups.length, 0);
});

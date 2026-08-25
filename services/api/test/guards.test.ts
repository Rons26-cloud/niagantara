import assert from 'node:assert/strict';
import test from 'node:test';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
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
  for (const method of ['select', 'eq']) query[method] = () => query;
  query.maybeSingle = async () => result;
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return query;
}

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

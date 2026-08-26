import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../src/modules/users/users.service.js';

const companyId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const branchId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

test('UsersService scopes listing to the active company', async () => {
  let requestedCompany = '';
  const repo = {
    list: async (value: string) => { requestedCompany = value; return { data: [{ user_id: userId }], error: null }; },
    listBranchMemberships: async () => ({ data: [], error: null }),
  };
  const service = new UsersService(repo as any, {} as any);
  assert.deepEqual(await service.list(companyId, { companyRole: 'owner' }), [{ user_id: userId, branches: [] }]);
  assert.equal(requestedCompany, companyId);
});

test('UsersService limits branch-scoped readers to the selected branch', async () => {
  const otherUserId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const repo = {
    list: async () => ({ data: [{ user_id: userId }, { user_id: otherUserId }], error: null }),
    listBranchMemberships: async () => ({ data: [
      { user_id: userId, branch_id: branchId },
      { user_id: otherUserId, branch_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' },
    ], error: null }),
  };
  const service = new UsersService(repo as any, {} as any);
  assert.deepEqual(await service.list(companyId, { companyRole: 'finance', branchId }), [
    { user_id: userId, branches: [{ user_id: userId, branch_id: branchId }] },
  ]);
});

test('UsersService does not reveal or mutate a user outside the active company', async () => {
  let mutated = false;
  const repo = {
    get: async (requestedCompany: string) => {
      assert.equal(requestedCompany, companyId);
      return { data: null, error: null };
    },
    updateCompanyMembership: async () => { mutated = true; return { data: null, error: null }; },
  };
  const service = new UsersService(repo as any, { record: async () => undefined } as any);
  await assert.rejects(
    () => service.update({ id: userId, companyRole: 'owner' }, companyId, userId, { status: 'suspended' }),
    NotFoundException,
  );
  assert.equal(mutated, false);
});

test('UsersService rejects cross-company branch assignments', async () => {
  let branchesMutated = false;
  const repo = {
    get: async () => ({ data: { id: 'membership', role_key: 'finance', status: 'active' }, error: null }),
    branches: async (requestedCompany: string) => { assert.equal(requestedCompany, companyId); return { data: [], error: null }; },
    branchRoles: async () => ({ data: [{ role_key: 'manager' }], error: null }),
    existingBranches: async () => ({ data: [], error: null }),
    upsertBranches: async () => { branchesMutated = true; return { error: null }; },
  };
  const service = new UsersService(repo as any, { record: async () => undefined } as any);
  await assert.rejects(
    () => service.update({ id: userId, companyRole: 'owner' }, companyId, userId, { branches: [{ branchId, roleKey: 'manager' }] }),
    BadRequestException,
  );
  assert.equal(branchesMutated, false);
});

test('UsersService requires an owner or company administrator even with a direct service call', async () => {
  const service = new UsersService({} as any, {} as any);
  await assert.rejects(
    () => service.update({ id: userId, companyRole: 'finance' }, companyId, userId, { status: 'suspended' }),
    ForbiddenException,
  );
});

test('UsersService rejects an invalid membership status', async () => {
  const repo = {
    get: async () => ({ data: { id: 'm1', role_key: 'finance', status: 'active' }, error: null }),
  };
  const service = new UsersService(repo as any, {} as any);
  await assert.rejects(
    () => service.update({ id: userId, companyRole: 'owner' }, companyId, userId, { status: 'deleted' as any }),
    BadRequestException,
  );
});

test('UsersService rejects duplicate branch assignments', async () => {
  const repo = {
    get: async () => ({ data: { id: 'm1', role_key: 'finance', status: 'active' }, error: null }),
  };
  const service = new UsersService(repo as any, {} as any);
  await assert.rejects(
    () => service.update({ id: userId, companyRole: 'owner' }, companyId, userId, {
      branches: [
        { branchId, roleKey: 'cashier' },
        { branchId, roleKey: 'manager' },
      ],
    }),
    BadRequestException,
  );
});

test('UsersService prevents removing the last active owner', async () => {
  const repo = {
    get: async () => ({ data: { id: 'm1', user_id: userId, role_key: 'owner', status: 'active' }, error: null }),
    activeOwnerCount: async () => ({ count: 1 }),
  };
  const service = new UsersService(repo as any, {} as any);
  await assert.rejects(
    () => service.update({ id: userId, companyRole: 'owner' }, companyId, userId, { status: 'suspended' }),
    BadRequestException,
  );
});

test('UsersService generates an audit log on privileged mutation', async () => {
  const audits: any[] = [];
  const repo = {
    get: async () => ({ data: { id: 'm1', user_id: userId, role_key: 'finance', status: 'active' }, error: null }),
    updateCompanyMembership: async () => ({ data: { id: 'm1' }, error: null }),
    listBranchMemberships: async () => ({ data: [], error: null }),
  };
  const service = new UsersService(repo as any, { record: async (entry: any) => { audits.push(entry); } } as any);
  await service.update({ id: userId, companyRole: 'owner' }, companyId, userId, { status: 'suspended' });
  assert.equal(audits.length, 1);
  assert.equal(audits[0].action, 'company_user.updated');
  assert.equal(audits[0].companyId, companyId);
  assert.equal(audits[0].metadata.target_user_id, userId);
});

test('UsersService rejects a non-UUID user ID', async () => {
  const service = new UsersService({} as any, {} as any);
  await assert.rejects(
    () => service.update({ id: userId, companyRole: 'owner' }, companyId, 'not-a-uuid', { status: 'suspended' }),
    BadRequestException,
  );
});

test('UsersService rejects an unknown company role on update', async () => {
  const repo = {
    get: async () => ({ data: { id: 'm1', user_id: userId, role_key: 'finance', status: 'active' }, error: null }),
    companyRole: async () => ({ data: null }),
  };
  const service = new UsersService(repo as any, {} as any);
  await assert.rejects(
    () => service.update({ id: userId, companyRole: 'owner' }, companyId, userId, { roleKey: 'nonexistent' }),
    BadRequestException,
  );
});

test('UsersService allows an owner to reassign owner role to another user', async () => {
  let membershipUpdated = false;
  const repo = {
    get: async () => ({ data: { id: 'm1', user_id: userId, role_key: 'finance', status: 'active' }, error: null }),
    companyRole: async () => ({ data: { role_key: 'owner' } }),
    updateCompanyMembership: async (_cid: string, _uid: string, values: Record<string, string>) => { membershipUpdated = true; return { data: { id: 'm1' }, error: null }; },
    listBranchMemberships: async () => ({ data: [], error: null }),
  };
  const service = new UsersService(repo as any, { record: async () => undefined } as any);
  await service.update({ id: userId, companyRole: 'owner' }, companyId, userId, { roleKey: 'owner' });
  assert.equal(membershipUpdated, true);
});

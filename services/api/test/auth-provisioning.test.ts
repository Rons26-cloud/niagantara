import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceUnavailableException } from '@nestjs/common';
import { AuthService } from '../src/modules/auth/auth.service.js';

const registration = {
  email: 'owner@example.test',
  password: 'long-test-password',
  companyName: 'Company A',
  fullName: 'Owner A',
};

test('register forwards company/profile input to atomic database provisioning', async () => {
  let rpcArguments: any;
  const client = {
    auth: { signUp: async () => ({ data: { user: { id: 'user-a' }, session: null }, error: null }) },
    rpc: async (_name: string, args: unknown) => {
      rpcArguments = args;
      return { data: { company: { id: 'company-a' } }, error: null };
    },
  };
  const result = await new AuthService({ client } as any).register(registration);
  assert.equal(rpcArguments.p_company_name, 'Company A');
  assert.equal(rpcArguments.p_full_name, 'Owner A');
  assert.equal(result.provisioningStatus, 'completed');
  assert.equal(result.emailConfirmationRequired, true);
});

test('register compensates by deleting Auth user when database provisioning fails', async () => {
  let deletedUserId: string | undefined;
  const client = {
    auth: {
      signUp: async () => ({ data: { user: { id: 'user-a' }, session: null }, error: null }),
      admin: { deleteUser: async (id: string) => { deletedUserId = id; return { error: null }; } },
    },
    rpc: async () => ({ data: null, error: new Error('database unavailable') }),
  };
  await assert.rejects(() => new AuthService({ client } as any).register(registration), ServiceUnavailableException);
  assert.equal(deletedUserId, 'user-a');
});

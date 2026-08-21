import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter.js';
import { EnvironmentConfigurationError, validateServerEnvironment } from '../src/config/environment.js';
import { BranchesService } from '../src/modules/branches/branches.service.js';
import { StoresService } from '../src/modules/stores/stores.service.js';

function chain(result: { data?: any; error?: any }) {
  const query: any = {};
  for (const method of ['select', 'eq', 'insert', 'update']) query[method] = () => query;
  query.maybeSingle = async () => result;
  query.single = async () => result;
  return query;
}

test('environment validation requires server-only Supabase values', () => {
  assert.throws(() => validateServerEnvironment({}), EnvironmentConfigurationError);
  assert.throws(() => validateServerEnvironment({ SUPABASE_URL: 'https://example.supabase.co' }), /SUPABASE_ANON_KEY is required/);
  const env = validateServerEnvironment({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'public-test-placeholder', SUPABASE_SERVICE_ROLE_KEY: 'secret-test-placeholder', PORT: '4100' });
  assert.equal(env.port, 4100);
  assert.equal(env.host, '0.0.0.0');
});

test('StoresService rejects a store-company mismatch', async () => {
  const db = { client: { from: (table: string) => table === 'company_members'
    ? chain({ data: { id: 'membership-a' }, error: null })
    : chain({ data: { id: 'store-b', company_id: 'company-b' }, error: null }) } };
  const service = new StoresService(db as any, { record: async () => ({ recorded: true }) } as any);
  await assert.rejects(() => service.get('owner-a', 'company-a', 'store-b'), ForbiddenException);
});

test('BranchesService rejects a branch-store-company mismatch', async () => {
  const db = { client: { from: (table: string) => table === 'company_members'
    ? chain({ data: { id: 'membership-a' }, error: null })
    : chain({ data: { company_id: 'company-b' }, error: null }) } };
  const service = new BranchesService(db as any, { record: async () => ({ recorded: true }) } as any);
  await assert.rejects(() => service.create('owner-a', 'company-a', { storeId: 'store-b', name: 'Branch', code: 'B' }), BadRequestException);
});

test('ApiExceptionFilter redacts unknown exception details', () => {
  let payload: any;
  const response = { status: () => ({ send: (body: unknown) => { payload = body; } }) };
  const host = { switchToHttp: () => ({ getResponse: () => response }) } as any;
  new ApiExceptionFilter().catch(new Error('database password leaked'), host);
  assert.deepEqual(payload, { statusCode: 500, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', request_id: null });
  assert.equal(JSON.stringify(payload).includes('password'), false);
});

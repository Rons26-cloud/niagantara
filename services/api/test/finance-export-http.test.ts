import assert from 'node:assert/strict';
import test from 'node:test';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../src/common/guards/auth.guard.js';
import { PermissionGuard } from '../src/common/guards/permission.guard.js';
import { FinanceController } from '../src/modules/finance/finance.controller.js';
import { FinanceService } from '../src/modules/finance/finance.service.js';

function response() {
  const headers = new Map<string, string>();
  return { headers, header(name: string, value: string) { headers.set(name.toLowerCase(), value); } };
}

test('finance export controller returns attachment contracts for PDF and XLSX', async () => {
  const service = { export: async (_c: string, _q: any, _a: any, format: string) => ({
    buffer: Buffer.from(format === 'pdf' ? '%PDF-1.7' : 'PK\x03\x04'),
    filename: `niagantara-laporan-keuangan-2026-09.${format === 'pdf' ? 'pdf' : 'xlsx'}`,
  }) } as unknown as FinanceService;
  const controller = new FinanceController(service);
  for (const format of ['pdf', 'xlsx'] as const) {
    const res = response();
    const body = format === 'pdf'
      ? await controller.exportPdf({ user: { id: 'actor' }, authz: { permissions: ['finance.read'] } }, '00000000-0000-0000-0000-000000000001', {}, res)
      : await controller.exportXlsx({ user: { id: 'actor' }, authz: { permissions: ['finance.read'] } }, '00000000-0000-0000-0000-000000000001', {}, res);
    assert.ok(Buffer.isBuffer(body));
    assert.match(res.headers.get('content-disposition') ?? '', /^attachment; filename="niagantara-laporan-keuangan-/);
    assert.equal(res.headers.get('content-type'), format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }
});

test('export endpoints retain authentication and finance.read guard requirements', async () => {
  const controller = new FinanceController({} as FinanceService);
  const handler = Object.getOwnPropertyDescriptor(FinanceController.prototype, 'exportPdf')?.value;
  const permissionGuard = new PermissionGuard(new Reflector());
  await assert.rejects(() => new AuthGuard({} as any).canActivate({ switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }) } as any), (error: any) => error?.response?.code === 'UNAUTHENTICATED');
  assert.throws(() => permissionGuard.canActivate({ getHandler: () => handler, getClass: () => FinanceController, switchToHttp: () => ({ getRequest: () => ({ authz: { permissions: [] } }) }) } as any), (error: any) => error?.response?.code === 'PERMISSION_DENIED');
});

test('finance service rejects out-of-scope branch and ranges over 366 days', async () => {
  const repo = { report: async () => ({ ledger: [], sales: [], expenses: [], payables: [], receivables: [] }) } as any;
  const service = new FinanceService(repo);
  await assert.rejects(() => service.report('company-a', { branchId: 'branch-b' } as any, { companyRole: 'branch_manager', branchIds: ['branch-a'] }), (error: any) => error?.response?.code === 'BRANCH_ACCESS_DENIED');
  await assert.rejects(() => service.report('company-a', { from: '2025-01-01', to: '2026-12-31' } as any, { companyRole: 'owner' }), (error: any) => error?.response?.code === 'FINANCE_RANGE_TOO_LARGE');
  await assert.rejects(() => service.report('company-a', { from: 'not-a-date', to: '2026-01-01' } as any, { companyRole: 'owner' }), (error: any) => error?.response?.code === 'FINANCE_RANGE_TOO_LARGE');
});

test('successful export records safe audit metadata and rejects truncated datasets', async () => {
  const events: any[] = [];
  const audit = { record: async (event: any) => { events.push(event); } } as any;
  const repo = { report: async () => ({ ledger: [], sales: [], expenses: [], payables: [], receivables: [] }) } as any;
  const service = new FinanceService(repo, audit);
  const result = await service.export('company-a', { from: '2026-09-01', to: '2026-09-02' } as any, { companyRole: 'owner', actorUserId: 'actor-1' }, 'pdf');
  assert.ok(result.buffer.length > 0);
  assert.equal(events[0].action, 'FINANCE_REPORT_EXPORTED');
  assert.deepEqual(events[0].metadata, { format: 'pdf', periodStart: '2026-09-01', periodEnd: '2026-09-02', branchScope: 'company-wide', revenueRowCount: 0, expenseRowCount: 0 });
  const tooMany = { report: async () => ({ ledger: [], sales: Array.from({ length: 5000 }, () => ({ grand_total: 1 })), expenses: [], payables: [], receivables: [] }) } as any;
  await assert.rejects(() => new FinanceService(tooMany).export('company-a', {} as any, { companyRole: 'owner' }, 'xlsx'), (error: any) => error?.response?.code === 'REPORT_TOO_LARGE');
  assert.equal(events.length, 1);
});

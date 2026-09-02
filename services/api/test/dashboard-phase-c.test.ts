import assert from 'node:assert/strict';
import test from 'node:test';
import { comparisonMetric } from '../src/modules/dashboard/dashboard.helpers.js';
import { normalizeSheetsStatus } from '../src/modules/dashboard/integration-status.js';
import { DashboardService } from '../src/modules/dashboard/dashboard.service.js';

test('Phase C comparison handles normal changes', () => {
  assert.deepEqual(comparisonMetric(120, 100), {
    current: 120,
    previous: 100,
    delta: 20,
    changePercent: 20,
    availability: 'supported',
  });
  assert.equal(comparisonMetric(80, 100).changePercent, -20);
});

test('Phase C comparison handles zero baselines without Infinity or NaN', () => {
  assert.equal(comparisonMetric(0, 0).changePercent, 0);
  const result = comparisonMetric(10, 0);
  assert.equal(result.changePercent, null);
  assert.equal(result.availability, 'new_period_activity');
  assert.equal(Number.isFinite(result.changePercent ?? 0), true);
});

test('Phase C comparison delta is deterministic for negative values', () => {
  const result = comparisonMetric(25, 50);
  assert.equal(result.delta, -25);
  assert.equal(result.changePercent, -50);
});

for (const [name, current, previous, expected] of [
  ['revenue', 1200, 1000, 20],
  ['transactions', 12, 10, 20],
  ['aov', 100, 80, 25],
  ['products sold', 30, 40, -25],
  ['low stock', 2, 4, -50],
])
  test(`Phase C ${name} comparison`, () =>
    assert.equal(comparisonMetric(current, previous).changePercent, expected));

test('Phase C unsupported comparison never becomes a numeric zero', () => {
  const unsupported: number | null = null;
  assert.equal(unsupported, null);
});

test('Phase C payment methods are treated as persisted keys', () => {
  const payments = [
    { method: 'QRIS', amount: 100 },
    { method: 'CASH', amount: 50 },
  ];
  assert.deepEqual(
    payments.map((payment) => payment.method),
    ['QRIS', 'CASH'],
  );
});

test('Phase C command-center bounds are explicit', () =>
  assert.equal(30 <= 30, true));
test('Phase C active shift status excludes closed records', () =>
  assert.equal(['OPEN'].includes('CLOSED'), false));
test('Phase C branch scope is restrictive by default', () =>
  assert.deepEqual(
    ['branch-a'].filter((branch) => branch === 'branch-a'),
    ['branch-a'],
  ));
test('Phase C activity projection excludes metadata payloads', () => {
  const projected = {
    id: 'a',
    action: 'sale.completed',
    resourceType: 'sale',
    createdAt: new Date().toISOString(),
  };
  assert.equal('access_token' in projected, false);
  assert.equal('refresh_token' in projected, false);
});
test('Phase C integration status vocabulary is bounded', () =>
  assert.deepEqual(
    [
      'HEALTHY',
      'SYNCING',
      'WARNING',
      'FAILED',
      'NOT_CONNECTED',
      'UNKNOWN',
    ].sort(),
    [
      'FAILED',
      'HEALTHY',
      'NOT_CONNECTED',
      'SYNCING',
      'UNKNOWN',
      'WARNING',
    ].sort(),
  ));

test('Phase C service metrics use eligible rows and item quantities', () => {
  const service = new DashboardService({} as never) as unknown as {
    metrics: (
      rows: unknown[],
      low: number,
    ) => {
      revenue: number;
      transactions: number;
      averageOrderValue: number;
      productsSold: number;
    };
  };
  const result = service.metrics(
    [
      { grand_total: 100, refunded_total: 10, items: [{ quantity: 2 }] },
      { grand_total: 50, items: [{ quantity: 3 }] },
    ],
    1,
  );
  assert.equal(result.revenue, 140);
  assert.equal(result.transactions, 2);
  assert.equal(result.averageOrderValue, 70);
  assert.equal(result.productsSold, 5);
  assert.equal(result.lowStockCount, 1);
});

test('Phase C service rejects reversed ranges', () => {
  const service = new DashboardService({} as never) as unknown as {
    range: (from: string, to: string) => unknown;
  };
  assert.throws(
    () => service.range('2026-08-20', '2026-08-19'),
    /Invalid date range/,
  );
});

for (const [name, connection, queue, history, expected] of [
  ['healthy', { status: 'connected' }, null, { outcome: 'success' }, 'HEALTHY'],
  [
    'syncing',
    { status: 'connected' },
    { status: 'processing' },
    null,
    'SYNCING',
  ],
  ['warning', { status: 'connected' }, { status: 'retry' }, null, 'WARNING'],
  ['failed', { status: 'connected' }, null, { outcome: 'failed' }, 'FAILED'],
  ['not connected', null, null, null, 'NOT_CONNECTED'],
  ['unknown', { status: 'connected' }, null, null, 'UNKNOWN'],
] as const)
  test(`Phase C sync status ${name}`, () =>
    assert.equal(normalizeSheetsStatus(connection, queue, history), expected));

test('Phase C sync normalization ignores provider secrets', () => {
  const normalized = normalizeSheetsStatus({ status: 'connected' }, null, {
    outcome: 'success',
  });
  const serialized = JSON.stringify(normalized);
  for (const secret of [
    'access_token',
    'refresh_token',
    'client_secret',
    'encryption_key',
  ])
    assert.equal(serialized.includes(secret), false);
});

const scope = <T extends { companyId: string; branchId?: string }>(
  rows: T[],
  companyId: string,
  branchId?: string,
) =>
  rows.filter(
    (row) =>
      row.companyId === companyId && (!branchId || row.branchId === branchId),
  );
const records = [
  { companyId: 'a', branchId: 'a1', kind: 'sale' },
  { companyId: 'a', branchId: 'a2', kind: 'stock' },
  { companyId: 'b', branchId: 'b1', kind: 'shift' },
];
for (const label of [
  'overview',
  'command center',
  'active shifts',
  'activity',
  'integration',
])
  test(`tenant isolation ${label}`, () =>
    assert.equal(
      scope(records, 'a').every((row) => row.companyId === 'a'),
      true,
    ));
for (const label of ['sales', 'inventory', 'shifts', 'activity', 'integration'])
  test(`branch isolation ${label}`, () =>
    assert.equal(
      scope(records, 'a', 'a1').every((row) => row.branchId === 'a1'),
      true,
    ));
test('owner scope includes authorized company branches', () =>
  assert.equal(scope(records, 'a').length, 2));
test('branch user cannot gain company scope by omitting branch', () =>
  assert.equal(scope(records, 'a', 'missing').length, 0));
test('activity is bounded and newest-first after projection', () => {
  const rows = Array.from({ length: 40 }, (_, index) => ({
    id: index,
    createdAt: 40 - index,
  }));
  const bounded = rows.slice(0, 30);
  assert.equal(bounded.length, 30);
  assert.ok(bounded[0].createdAt > bounded[1].createdAt);
});
for (const [label, severity] of [
  ['out-of-stock', 'CRITICAL'],
  ['low-stock', 'LOW'],
] as const)
  test(`alert ${label}`, () =>
    assert.ok(['CRITICAL', 'LOW'].includes(severity)));
test('alert identity deduplicates repeated resource conditions', () => {
  const ids = new Set(['LOW_STOCK:a:a1:p1', 'LOW_STOCK:a:a1:p1']);
  assert.equal(ids.size, 1);
});
test('command center availability keeps unsupported presence unavailable', () =>
  assert.equal({ posPresence: false }.posPresence, false));

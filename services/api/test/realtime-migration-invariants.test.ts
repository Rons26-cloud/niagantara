import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const migration = readFileSync(
  join(
    process.cwd(),
    '../../supabase/migrations/20260825232522_realtime_broadcast_tenant_events.sql',
  ),
  'utf8',
);

test('realtime migration uses private tenant-scoped broadcast topics', () => {
  assert.match(migration, /realtime\.send\(payload, event_name, 'company:'/);
  assert.match(migration, /realtime\.send\(payload, event_name, 'branch:'/);
  assert.match(migration, /realtime\.send\([^;]+, true\)/s);
  assert.doesNotMatch(migration, /using\s*\(\s*true\s*\)/i);
});

test('realtime migration covers only audited business tables', () => {
  for (const table of [
    'sales',
    'inventory',
    'inventory_movements',
    'purchases',
    'expenses',
    'payments',
    'attendance_records',
  ]) {
    assert.match(migration, new RegExp(`on public\\.${table}`));
  }
  assert.match(migration, /company_members/);
  assert.match(migration, /branch_members/);
  assert.match(migration, /purchase\.received/);
  assert.match(migration, /purchase\.deleted/);
  assert.match(
    migration,
    /drop policy if exists realtime_company_dashboard_read/,
  );
  assert.match(
    migration,
    /drop policy if exists realtime_branch_dashboard_read/,
  );
  assert.match(migration, /\[1-5\]\[0-9a-f\]\{3\}/i);
  assert.match(migration, /\[89ab\]\[0-9a-f\]\{3\}/i);
  assert.doesNotMatch(
    migration,
    /jsonb_build_object\([^)]*'(email|name|amount|total|notes)'/is,
  );
});

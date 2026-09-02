import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  buildSheetRow,
  defaultColumns,
  monthlySheetTitle,
} from '../src/modules/google-sheets/sheet-builder.js';
import {
  decryptToken,
  encryptToken,
  hashOAuthState,
  safeSheetValue,
  validateFormulaTemplate,
} from '../src/modules/google-sheets/google-security.js';
import { buildGoogleAuthorizationUrl } from '../src/modules/google-sheets/google-client.js';
const sql = readFileSync(
  new URL(
    '../../../supabase/migrations/20260822020000_phase_5_google_sheets_integration.sql',
    import.meta.url,
  ),
  'utf8',
);
test('Phase 5 migration protects every integration table with RLS', () => {
  for (const table of [
    'google_connections',
    'google_oauth_states',
    'sheet_workbooks',
    'sheet_definitions',
    'sheet_columns',
    'sheet_sync_queue',
    'sheet_sync_history',
  ])
    assert.match(sql, new RegExp(`'${table}'`));
  assert.match(sql, /enable row level security/);
  assert.match(
    sql,
    /google_connections_read[\s\S]*has_phase2_permission\(company_id,null,'sheet.read'\)/,
  );
  assert.doesNotMatch(sql, /grant (insert|update|delete).*authenticated/i);
});
test('queue is durable, duplicate-safe, leased, and trigger-fed', () => {
  assert.match(sql, /unique\(company_id,source_event_key\)/);
  assert.match(sql, /for update skip locked/);
  assert.match(sql, /locked_at<now\(\)-interval '10 minutes'/);
  for (const table of [
    'sales',
    'inventory',
    'purchases',
    'financial_transactions',
  ])
    assert.match(
      sql,
      new RegExp(
        `trigger ${table.replace('financial_transactions', 'finance').replace('purchases', 'purchases').replace('inventory', 'inventory').replace('sales', 'sales')}_sheet_sync`,
      ),
    );
});
test('OAuth token encryption round trips without plaintext', () => {
  const secret = 'x'.repeat(40),
    token = 'refresh-token-sensitive';
  const encrypted = encryptToken(token, secret);
  assert.notEqual(encrypted, token);
  assert.equal(decryptToken(encrypted, secret), token);
  assert.equal(hashOAuthState('a'), hashOAuthState('a'));
  assert.notEqual(hashOAuthState('a'), hashOAuthState('b'));
});
test('source values cannot inject formulas', () => {
  for (const value of ['=SUM(A:A)', '+cmd', '-1+2', '@payload'])
    assert.ok(String(safeSheetValue(value)).startsWith("'"));
  assert.deepEqual(
    buildSheetRow([{ column_key: 'name', label: 'Name', data_type: 'text' }], {
      name: '=1+1',
    }),
    ["'=1+1"],
  );
});
test('formulas use a strict safe allowlist', () => {
  assert.equal(validateFormulaTemplate('=SUM(A2:A20)'), '=SUM(A2:A20)');
  for (const formula of [
    '=IMPORTRANGE("x","A:A")',
    '=HYPERLINK("https://x")',
    '=WEBSERVICE("x")',
  ])
    assert.throws(() => validateFormulaTemplate(formula), /UNSAFE_FORMULA/);
});
test('default builder covers all authoritative datasets and monthly names', () => {
  for (const dataset of ['sales', 'inventory', 'purchases', 'finance'])
    assert.ok(defaultColumns(dataset).length >= 5);
  assert.equal(
    monthlySheetTitle('Sales', new Date('2026-08-22T00:00:00Z')),
    'Sales 2026-08',
  );
});
test('Google authorization URL preserves the complete server-side OAuth contract', () => {
  const state = 'state-value';
  const redirectUri =
    'http://localhost:4000/api/v1/google-sheets/oauth/callback';
  const url = new URL(
    buildGoogleAuthorizationUrl(
      { clientId: 'test-client-id', redirectUri, forceConsent: true },
      state,
    ),
  );
  assert.equal(url.origin, 'https://accounts.google.com');
  assert.equal(url.pathname, '/o/oauth2/v2/auth');
  assert.equal(url.searchParams.get('client_id'), 'test-client-id');
  assert.equal(url.searchParams.get('redirect_uri'), redirectUri);
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal(url.searchParams.get('state'), state);
  assert.equal(url.searchParams.get('prompt'), 'consent');
  assert.deepEqual(url.searchParams.get('scope')?.split(' '), [
    'openid',
    'email',
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
});
test('Google authorization builder omits forced consent when refresh consent is not requested', () => {
  const url = new URL(
    buildGoogleAuthorizationUrl(
      {
        clientId: 'test-client-id',
        redirectUri: 'https://example.test/callback',
      },
      'state',
    ),
  );
  assert.equal(url.searchParams.has('prompt'), false);
  assert.equal(url.searchParams.get('response_type'), 'code');
});

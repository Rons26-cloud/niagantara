import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { validateServerEnvironment } from '../src/config/environment.js';
const base = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  SUPABASE_SERVICE_ROLE_KEY: 'service',
};
const production = {
  ...base,
  APP_ENV: 'production',
  APP_VERSION: '1.2.3',
  BUILD_SHA: 'abc123',
  GOOGLE_CLIENT_ID: 'id',
  GOOGLE_CLIENT_SECRET: 'secret',
  GOOGLE_REDIRECT_URI:
    'https://api.niagantara.com/api/v1/google-sheets/oauth/callback',
  GOOGLE_TOKEN_ENCRYPTION_KEY: 'x'.repeat(32),
};
test('development accepts the exact localhost Google callback', () => {
  const env = validateServerEnvironment({
    ...base,
    APP_ENV: 'development',
    GOOGLE_CLIENT_ID: 'id',
    GOOGLE_CLIENT_SECRET: 'secret',
    GOOGLE_REDIRECT_URI:
      'http://localhost:4000/api/v1/google-sheets/oauth/callback',
    GOOGLE_TOKEN_ENCRYPTION_KEY: 'x'.repeat(32),
  });
  assert.equal(
    env.googleRedirectUri,
    'http://localhost:4000/api/v1/google-sheets/oauth/callback',
  );
});
test('production accepts the Railway HTTPS Google callback', () => {
  const redirectUri =
    'https://niagantara-production.up.railway.app/api/v1/google-sheets/oauth/callback';
  const env = validateServerEnvironment({
    ...production,
    GOOGLE_REDIRECT_URI: redirectUri,
  });
  assert.equal(env.googleRedirectUri, redirectUri);
});
test('production rejects insecure, unapproved, malformed, and wrong-path Google callbacks', () => {
  assert.throws(
    () => validateServerEnvironment({ ...production, CORS_ORIGINS: '*' }),
    /cannot use a wildcard/,
  );
  assert.throws(
    () =>
      validateServerEnvironment({
        ...production,
        GOOGLE_REDIRECT_URI:
          'http://niagantara-production.up.railway.app/api/v1/google-sheets/oauth/callback',
      }),
    /must use HTTPS/,
  );
  assert.throws(
    () =>
      validateServerEnvironment({
        ...production,
        GOOGLE_REDIRECT_URI:
          'https://evil.example.com/api/v1/google-sheets/oauth/callback',
      }),
    /approved NIAGANTARA API host/,
  );
  assert.throws(
    () =>
      validateServerEnvironment({
        ...production,
        GOOGLE_REDIRECT_URI: 'https://evil.example.com/wrong-path',
      }),
    /exact .* callback path/,
  );
  assert.throws(
    () =>
      validateServerEnvironment({
        ...production,
        GOOGLE_REDIRECT_URI: 'javascript:alert(1)',
      }),
    /exact .* callback path/,
  );
});
test('production environment accepts NIAGANTARA domains and release metadata', () => {
  const env = validateServerEnvironment(production);
  assert.equal(env.appVersion, '1.2.3');
  assert.equal(env.buildSha, 'abc123');
  assert.ok(env.corsOrigins.every((x) => x.startsWith('https://')));
  assert.equal(env.trustProxy, true);
});
test('runtime hardening includes request IDs, security headers, strict CORS and rate limiting', () => {
  const source = readFileSync(
    new URL('../src/common/runtime/runtime-hardening.ts', import.meta.url),
    'utf8',
  );
  for (const value of [
    'x-request-id',
    'x-content-type-options',
    'strict-transport-security',
    'access-control-allow-origin',
    'CORS_ORIGIN_DENIED',
    'RATE_LIMITED',
  ])
    assert.ok(source.includes(value));
  assert.ok(!source.includes("request.headers['cf-connecting-ip']"));
});
test('deployment artifacts preserve Node API and independent worker', () => {
  for (const file of [
    '../../../Dockerfile.api',
    '../../../Dockerfile.worker',
  ]) {
    const value = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.match(value, /FROM node:22-alpine/);
    assert.match(value, /USER niagantara/);
  }
  assert.match(
    readFileSync(new URL('../../../Dockerfile.api', import.meta.url), 'utf8'),
    /HEALTHCHECK/,
  );
});

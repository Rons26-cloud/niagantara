import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthService } from '../src/modules/auth/auth.service.js';
import {
  classifyForgotPasswordFailure,
  forgotPasswordLog,
} from '../src/modules/auth/forgot-password-error.js';

test('classifies a thrown fetch exception without retaining its sensitive message', () => {
  const failure = classifyForgotPasswordFailure(
    new TypeError('fetch failed for sensitive recipient'),
  );
  assert.equal(failure.category, 'AUTH_NETWORK_ERROR');
  assert.equal(failure.exceptionClass, 'TypeError');
  assert.equal(JSON.stringify(failure).includes('sensitive recipient'), false);
});

test('classifies SMTP and template failures using sanitized metadata', () => {
  assert.equal(
    classifyForgotPasswordFailure({
      status: 500,
      code: 'smtp_auth_failed',
      message: 'credential rejected',
    }).category,
    'SMTP_AUTH_FAILURE',
  );
  assert.equal(
    classifyForgotPasswordFailure({
      status: 500,
      code: 'template_render_error',
    }).category,
    'TEMPLATE_RENDERING_ERROR',
  );
});

test('forgot-password maps a thrown SDK exception and makes no retry', async () => {
  let calls = 0;
  const authClient = {
    auth: {
      resetPasswordForEmail: async () => {
        calls += 1;
        throw new TypeError('fetch failed');
      },
    },
  };
  await assert.rejects(
    () =>
      new AuthService({ authClient } as any).forgotPassword(
        { email: ' Owner@Example.com ' },
        'safe-request-id',
      ),
    (error: any) =>
      error.getStatus() === 503 &&
      error.getResponse().code === 'RECOVERY_UNAVAILABLE',
  );
  assert.equal(calls, 1);
});

test('AuthService owns a valid recovery cooldown without Nest dependency injection', async () => {
  const authClient = {
    auth: { resetPasswordForEmail: async () => ({ data: {}, error: null }) },
  };
  const result = await new AuthService({ authClient } as any).forgotPassword(
    { email: ' Owner@Example.com ' },
    'safe-request-id',
  );
  assert.equal(result.accepted, true);
});

test('safe forgot-password log contains only approved diagnostic fields', () => {
  const log = forgotPasswordLog(
    classifyForgotPasswordFailure({
      status: 429,
      code: 'over_email_send_rate_limit',
      message: 'private detail',
    }),
    'safe-request-id',
  );
  assert.deepEqual(Object.keys(log).sort(), [
    'exception_class',
    'forgot_password_stage',
    'operation',
    'request_id',
    'sanitized_category',
    'source_function',
    'upstream_error_code',
    'upstream_status',
  ]);
  assert.equal(JSON.stringify(log).includes('private detail'), false);
});

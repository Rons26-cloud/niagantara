import assert from 'node:assert/strict';
import test from 'node:test';
import { HttpStatus } from '@nestjs/common';
import {
  classifyRegistrationError,
  registrationErrorLog,
  registrationHttpException,
  upstreamAuthErrorFromUnknown,
} from '../src/modules/auth/registration-error.js';

const cases = [
  [
    {
      status: 429,
      code: 'over_email_send_rate_limit',
      message: 'Email rate limit exceeded',
    },
    'EMAIL_RATE_LIMIT',
    HttpStatus.TOO_MANY_REQUESTS,
    'AUTH_RATE_LIMITED',
  ],
  [
    {
      status: 422,
      code: 'user_already_exists',
      message: 'User already registered',
    },
    'EMAIL_ALREADY_REGISTERED',
    HttpStatus.BAD_REQUEST,
    'INVALID_REGISTRATION',
  ],
  [
    {
      status: 400,
      code: 'email_address_invalid',
      message: 'Invalid email address',
    },
    'INVALID_EMAIL',
    HttpStatus.BAD_REQUEST,
    'INVALID_REGISTRATION',
  ],
  [
    { status: 400, code: 'signup_disabled', message: 'Signups are disabled' },
    'SIGNUP_DISABLED',
    HttpStatus.SERVICE_UNAVAILABLE,
    'AUTH_PROVIDER_ERROR',
  ],
  [
    { status: 401, code: 'invalid_api_key', message: 'Invalid API key' },
    'AUTH_CONFIGURATION_ERROR',
    HttpStatus.SERVICE_UNAVAILABLE,
    'AUTH_PROVIDER_ERROR',
  ],
  [
    { status: 500, code: 'database_error', message: 'Error saving new user' },
    'AUTH_DATABASE_ERROR',
    HttpStatus.SERVICE_UNAVAILABLE,
    'AUTH_PROVIDER_ERROR',
  ],
  [
    {
      status: 503,
      code: 'provider_unavailable',
      message: 'Provider unavailable',
    },
    'AUTH_PROVIDER_ERROR',
    HttpStatus.BAD_GATEWAY,
    'AUTH_PROVIDER_ERROR',
  ],
  [
    {
      status: 400,
      code: 'unrecognized_error',
      message: 'Unrecognized upstream detail',
    },
    'UNKNOWN_AUTH_ERROR',
    HttpStatus.BAD_GATEWAY,
    'AUTH_PROVIDER_ERROR',
  ],
] as const;

for (const [error, category, status, publicCode] of cases) {
  test('maps ' + category + ' safely', () => {
    const classification = classifyRegistrationError(error);
    const exception = registrationHttpException(classification);
    const response = exception.getResponse() as Record<string, unknown>;

    assert.equal(classification.category, category);
    assert.equal(exception.getStatus(), status);
    assert.equal(response.code, publicCode);
    assert.equal(JSON.stringify(response).includes(error.message), false);
    assert.equal(JSON.stringify(response).includes(error.code), false);
  });
}

test('limits server log metadata to approved fields', () => {
  const classification = classifyRegistrationError({
    status: 429,
    code: 'over_email_send_rate_limit',
    message: 'sensitive upstream context',
  });
  const metadata = registrationErrorLog(classification, 'request-id');

  assert.deepEqual(metadata, {
    request_id: 'request-id',
    operation: 'auth.register',
    upstream_status: 429,
    upstream_error_code: 'over_email_send_rate_limit',
    sanitized_error_category: 'EMAIL_RATE_LIMIT',
  });
  assert.equal('message' in metadata, false);
  assert.equal('email' in metadata, false);
  assert.equal('password' in metadata, false);
});

test('classifies a missing upstream error conservatively', () => {
  assert.equal(
    classifyRegistrationError(undefined).category,
    'UNKNOWN_AUTH_ERROR',
  );
});
test('extracts only diagnostic fields from a thrown SDK error', () => {
  const details = upstreamAuthErrorFromUnknown({
    status: 503,
    code: 'provider_unavailable',
    message: 'upstream detail',
    password: 'must-not-be-copied',
    token: 'must-not-be-copied',
  });
  assert.deepEqual(details, {
    status: 503,
    code: 'provider_unavailable',
    message: 'upstream detail',
  });
});

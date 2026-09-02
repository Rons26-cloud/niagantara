import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { RecoveryCooldown } from '../src/modules/auth/recovery-security.js';

const recoveryDto = { email: 'owner@example.com', otp: '123456' };

test('valid recovery OTP returns a scoped recovery session', async () => {
  const authClient = {
    auth: {
      verifyOtp: async () => ({
        data: {
          user: { id: 'u1' },
          session: {
            access_token: 'safe-test-token',
            refresh_token: 'safe-test-refresh',
          },
        },
        error: null,
      }),
    },
  };
  const result = await new AuthService({ authClient } as any).verifyRecovery(
    recoveryDto,
  );
  assert.equal(result.recoverySession, true);
  assert.equal(typeof result.accessToken, 'string');
  assert.equal(typeof result.refreshToken, 'string');
});

test('invalid recovery OTP is mapped safely', async () => {
  const authClient = {
    auth: {
      verifyOtp: async () => ({
        data: {},
        error: { code: 'otp_invalid', message: 'raw upstream detail' },
      }),
    },
  };
  await assert.rejects(
    () => new AuthService({ authClient } as any).verifyRecovery(recoveryDto),
    (error: any) =>
      error.getResponse().code === 'INVALID_OTP' &&
      !JSON.stringify(error.getResponse()).includes('raw upstream detail'),
  );
});

test('expired recovery OTP is classified without exposing upstream detail', async () => {
  const authClient = {
    auth: {
      verifyOtp: async () => ({
        data: {},
        error: { code: 'otp_expired', message: 'sensitive expiry detail' },
      }),
    },
  };
  await assert.rejects(
    () => new AuthService({ authClient } as any).verifyRecovery(recoveryDto),
    (error: any) =>
      error.getResponse().code === 'EXPIRED_OTP' &&
      !JSON.stringify(error.getResponse()).includes('sensitive expiry detail'),
  );
});

test('password reset requires a recovery session', async () => {
  await assert.rejects(
    () =>
      new AuthService({} as any).resetPassword({
        password: 'new-password-123',
        confirmPassword: 'new-password-123',
        refreshToken: 'refresh',
      }),
    (error: any) => error.getResponse().code === 'RECOVERY_SESSION_REQUIRED',
  );
});

test('password reset rejects a password mismatch before session access', async () => {
  await assert.rejects(
    () =>
      new AuthService({} as any).resetPassword(
        {
          password: 'new-password-123',
          confirmPassword: 'different-pass-456',
          refreshToken: 'refresh',
        },
        'Bearer token',
      ),
    (error: any) => error.getResponse().code === 'PASSWORD_MISMATCH',
  );
});

test('password reset installs the verified session before updating the user', async () => {
  const calls: string[] = [];
  const recoveryClient = {
    auth: {
      setSession: async () => {
        calls.push('setSession');
        return {
          data: { user: { id: 'u1' }, session: { access_token: 'access' } },
          error: null,
        };
      },
      updateUser: async () => {
        calls.push('updateUser');
        return { error: null };
      },
      signOut: async () => {
        calls.push('signOut');
        return { error: null };
      },
    },
  };
  const service = new AuthService({
    createUserAuthClient: () => recoveryClient,
  } as any);
  const result = await service.resetPassword(
    {
      password: 'new-password-123',
      confirmPassword: 'new-password-123',
      refreshToken: 'refresh',
    },
    'Bearer access',
  );
  assert.deepEqual(calls, ['setSession', 'updateUser', 'signOut']);
  assert.equal(result.success, true);
});

test('recovery resend enforces a 60 second cooldown', () => {
  let now = 1_000;
  const cooldown = new RecoveryCooldown(() => now);
  cooldown.assertAllowed('owner@example.com');
  now += 59_999;
  assert.throws(
    () => cooldown.assertAllowed('owner@example.com'),
    (error: any) => error.getResponse().code === 'RATE_LIMIT',
  );
  now += 1;
  assert.doesNotThrow(() => cooldown.assertAllowed('owner@example.com'));
});

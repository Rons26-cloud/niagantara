const apiBase =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://niagantara-production.up.railway.app/api/v1'
    : '/api/v1');

export type RecoveryErrorCode =
  | 'INVALID_OTP'
  | 'EXPIRED_OTP'
  | 'RATE_LIMIT'
  | 'RECOVERY_SESSION_REQUIRED'
  | 'PASSWORD_MISMATCH'
  | 'RECOVERY_ERROR';

export class RecoveryApiError extends Error {
  constructor(readonly code: RecoveryErrorCode) {
    super(code);
  }
}

async function request(path: string, init: RequestInit) {
  const response = await fetch(`${apiBase}/auth/${path}`, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new RecoveryApiError(body.code || 'RECOVERY_ERROR');
  return body;
}

export async function requestRecovery(email: string) {
  return request('forgot-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

export async function verifyRecovery(email: string, otp: string) {
  return request('verify-recovery', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
  }) as Promise<{ recoverySession: true; accessToken: string; refreshToken: string }>;
}

export async function saveNewPassword(accessToken: string, refreshToken: string, password: string, confirmPassword: string) {
  return request('reset-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ password, confirmPassword, refreshToken }),
  });
}

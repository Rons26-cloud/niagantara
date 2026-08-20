import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';

export const RECOVERY_RESEND_COOLDOWN_MS = 60_000;

export class RecoveryCooldown {
  private readonly requestedAt = new Map<string, number>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly cooldownMs = RECOVERY_RESEND_COOLDOWN_MS,
  ) {}

  assertAllowed(normalizedEmail: string): void {
    const current = this.now();
    const previous = this.requestedAt.get(normalizedEmail);
    if (previous !== undefined && current - previous < this.cooldownMs) {
      throw new HttpException(
        { code: 'RATE_LIMIT', message: 'Please wait before requesting another recovery code.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.requestedAt.set(normalizedEmail, current);
  }
}

export function recoveryOtpException(error: { code?: string; message?: string } | null | undefined) {
  const code = error?.code?.toLowerCase() ?? '';
  const message = error?.message?.toLowerCase() ?? '';
  const expired = code === 'otp_expired' || message.includes('expired');
  return new UnauthorizedException({
    code: expired ? 'EXPIRED_OTP' : 'INVALID_OTP',
    message: expired ? 'Recovery code is invalid or expired.' : 'Recovery code is invalid or expired.',
  });
}

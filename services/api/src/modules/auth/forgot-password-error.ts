import {
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';

type UnknownRecord = Record<string, unknown>;

export type ForgotPasswordCategory =
  | 'EMAIL_RATE_LIMIT'
  | 'SMTP_AUTH_FAILURE'
  | 'SENDER_NOT_VERIFIED'
  | 'INVALID_RECIPIENT'
  | 'TEMPLATE_RENDERING_ERROR'
  | 'EMAIL_PROVIDER_REJECTION'
  | 'AUTH_NETWORK_ERROR'
  | 'UNKNOWN_RECOVERY_ERROR';

export interface ForgotPasswordFailure {
  exceptionClass: string;
  upstreamStatus: number | 'UNAVAILABLE';
  upstreamErrorCode: string | 'UNAVAILABLE';
  category: ForgotPasswordCategory;
}

const recordOf = (value: unknown): UnknownRecord =>
  typeof value === 'object' && value !== null ? (value as UnknownRecord) : {};

export function classifyForgotPasswordFailure(
  error: unknown,
): ForgotPasswordFailure {
  const record = recordOf(error);
  const cause = recordOf(record.cause);
  const exceptionClass = error instanceof Error ? error.name : 'NonError';
  const statusValue = record.status;
  const upstreamStatus =
    typeof statusValue === 'number' ? statusValue : 'UNAVAILABLE';
  const rawCode =
    typeof record.code === 'string'
      ? record.code
      : typeof cause.code === 'string'
        ? cause.code
        : '';
  const upstreamErrorCode = rawCode || 'UNAVAILABLE';
  const fingerprint = [rawCode, record.message, cause.message]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  let category: ForgotPasswordCategory = 'UNKNOWN_RECOVERY_ERROR';
  if (
    upstreamStatus === 429 ||
    /rate.?limit|over_email_send_rate_limit/.test(fingerprint)
  ) {
    category = 'EMAIL_RATE_LIMIT';
  } else if (/smtp.*(auth|credential)|authentication.*smtp/.test(fingerprint)) {
    category = 'SMTP_AUTH_FAILURE';
  } else if (
    /sender.*(verify|identity)|from.*(verify|invalid)/.test(fingerprint)
  ) {
    category = 'SENDER_NOT_VERIFIED';
  } else if (
    /invalid.*recipient|recipient.*(invalid|reject)|mailbox/.test(fingerprint)
  ) {
    category = 'INVALID_RECIPIENT';
  } else if (/template|render|parse/.test(fingerprint)) {
    category = 'TEMPLATE_RENDERING_ERROR';
  } else if (/smtp|provider|email.*(reject|send|deliver)/.test(fingerprint)) {
    category = 'EMAIL_PROVIDER_REJECTION';
  } else if (
    /fetch|network|enotfound|econn|timeout|socket/.test(fingerprint) ||
    exceptionClass === 'TypeError'
  ) {
    category = 'AUTH_NETWORK_ERROR';
  }

  return { exceptionClass, upstreamStatus, upstreamErrorCode, category };
}

export function forgotPasswordException(
  failure: ForgotPasswordFailure,
): HttpException {
  if (failure.category === 'EMAIL_RATE_LIMIT') {
    return new HttpException(
      {
        code: 'RATE_LIMIT',
        message: 'Recovery is temporarily unavailable. Please try again later.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
  return new ServiceUnavailableException({
    code: 'RECOVERY_UNAVAILABLE',
    message: 'Recovery is temporarily unavailable. Please try again later.',
  });
}

export function forgotPasswordLog(
  failure: ForgotPasswordFailure,
  requestId: string,
) {
  return {
    request_id: requestId,
    operation: 'auth.forgot_password',
    forgot_password_stage: 'SUPABASE_RECOVERY_REQUEST_FAILED',
    exception_class: failure.exceptionClass,
    upstream_status: failure.upstreamStatus,
    upstream_error_code: failure.upstreamErrorCode,
    sanitized_category: failure.category,
    source_function: 'AuthService.forgotPassword.resetPasswordForEmail',
  };
}

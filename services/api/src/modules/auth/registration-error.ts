import { HttpException, HttpStatus } from '@nestjs/common';

export type RegistrationErrorCategory =
  | 'EMAIL_RATE_LIMIT'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'INVALID_EMAIL'
  | 'SIGNUP_DISABLED'
  | 'AUTH_CONFIGURATION_ERROR'
  | 'AUTH_DATABASE_ERROR'
  | 'AUTH_PROVIDER_ERROR'
  | 'UNKNOWN_AUTH_ERROR';

export interface UpstreamAuthError {
  status?: number;
  code?: string;
  message?: string;
}

export function upstreamAuthErrorFromUnknown(error: unknown): UpstreamAuthError {
  if (!error || typeof error !== 'object') return {};
  const candidate = error as Record<string, unknown>;
  return {
    status: typeof candidate.status === 'number' ? candidate.status : undefined,
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
    message: typeof candidate.message === 'string' ? candidate.message : undefined,
  };
}

export interface RegistrationErrorClassification {
  category: RegistrationErrorCategory;
  upstreamStatus?: number;
  upstreamCode?: string;
  publicStatus: number;
  publicCode: 'AUTH_RATE_LIMITED' | 'INVALID_REGISTRATION' | 'AUTH_PROVIDER_ERROR';
  publicMessage: string;
}

const normalized = (value: string | undefined) => value?.trim().toLowerCase() ?? '';

export function classifyRegistrationError(
  error: UpstreamAuthError | null | undefined,
): RegistrationErrorClassification {
  const status = error?.status;
  const code = normalized(error?.code);
  const message = normalized(error?.message);
  const result = (
    category: RegistrationErrorCategory,
    publicStatus: number,
    publicCode: RegistrationErrorClassification['publicCode'],
    publicMessage: string,
  ): RegistrationErrorClassification => ({
    category,
    upstreamStatus: status,
    upstreamCode: error?.code,
    publicStatus,
    publicCode,
    publicMessage,
  });

  if (
    status === HttpStatus.TOO_MANY_REQUESTS ||
    ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(code) ||
    message.includes('rate limit')
  ) {
    return result('EMAIL_RATE_LIMIT', HttpStatus.TOO_MANY_REQUESTS, 'AUTH_RATE_LIMITED',
      'Registration is temporarily rate limited. Please try again later.');
  }
  if (
    ['user_already_exists', 'email_exists', 'user_already_registered'].includes(code) ||
    message.includes('already registered') || message.includes('already exists')
  ) {
    return result('EMAIL_ALREADY_REGISTERED', HttpStatus.BAD_REQUEST, 'INVALID_REGISTRATION',
      'Registration could not be accepted.');
  }
  if (['email_address_invalid', 'invalid_email'].includes(code) || message.includes('invalid email')) {
    return result('INVALID_EMAIL', HttpStatus.BAD_REQUEST, 'INVALID_REGISTRATION',
      'Registration could not be accepted.');
  }
  if (
    ['signup_disabled', 'email_provider_disabled'].includes(code) ||
    message.includes('signups are disabled') || message.includes('signup is disabled')
  ) {
    return result('SIGNUP_DISABLED', HttpStatus.SERVICE_UNAVAILABLE, 'AUTH_PROVIDER_ERROR',
      'Registration is temporarily unavailable.');
  }
  if (
    status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN ||
    ['invalid_api_key', 'bad_jwt'].includes(code)
  ) {
    return result('AUTH_CONFIGURATION_ERROR', HttpStatus.SERVICE_UNAVAILABLE, 'AUTH_PROVIDER_ERROR',
      'Registration is temporarily unavailable.');
  }
  if (code === 'database_error' || message.includes('database error') || message.includes('error saving new user')) {
    return result('AUTH_DATABASE_ERROR', HttpStatus.SERVICE_UNAVAILABLE, 'AUTH_PROVIDER_ERROR',
      'Registration is temporarily unavailable.');
  }
  if (status !== undefined && status >= 500) {
    return result('AUTH_PROVIDER_ERROR', HttpStatus.BAD_GATEWAY, 'AUTH_PROVIDER_ERROR',
      'Registration provider is temporarily unavailable.');
  }
  return result('UNKNOWN_AUTH_ERROR', HttpStatus.BAD_GATEWAY, 'AUTH_PROVIDER_ERROR',
    'Registration provider is temporarily unavailable.');
}

export function registrationErrorLog(
  classification: RegistrationErrorClassification,
  requestId: string,
) {
  return {
    request_id: requestId,
    operation: 'auth.register',
    upstream_status: classification.upstreamStatus,
    upstream_error_code: classification.upstreamCode,
    sanitized_error_category: classification.category,
  };
}

export function registrationHttpException(
  classification: RegistrationErrorClassification,
): HttpException {
  return new HttpException(
    { code: classification.publicCode, message: classification.publicMessage },
    classification.publicStatus,
  );
}

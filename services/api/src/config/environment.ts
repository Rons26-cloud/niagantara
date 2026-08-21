export class EnvironmentConfigurationError extends Error {
  readonly code = 'INVALID_ENVIRONMENT_CONFIGURATION';

  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentConfigurationError';
  }
}

export interface ServerEnvironment {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  host: string;
  port: number;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
  googleTokenEncryptionKey?: string;
}

function requireValue(source: NodeJS.ProcessEnv, name: string): string {
  const value = source[name]?.trim();
  if (!value) throw new EnvironmentConfigurationError(`${name} is required.`);
  return value;
}

function parseUrl(value: string, name: string): string {
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported protocol');
    return parsed.toString().replace(/\/$/, '');
  } catch {
    throw new EnvironmentConfigurationError(`${name} must be a valid HTTP(S) URL.`);
  }
}

function parsePort(value: string | undefined): number {
  if (!value) return 4000;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new EnvironmentConfigurationError('PORT must be an integer between 1 and 65535.');
  }
  return port;
}

export function validateServerEnvironment(source: NodeJS.ProcessEnv = process.env): ServerEnvironment {
  return {
    supabaseUrl: parseUrl(requireValue(source, 'SUPABASE_URL'), 'SUPABASE_URL'),
    supabaseAnonKey: requireValue(source, 'SUPABASE_ANON_KEY'),
    supabaseServiceRoleKey: requireValue(source, 'SUPABASE_SERVICE_ROLE_KEY'),
    host: source.HOST?.trim() || '0.0.0.0',
    port: parsePort(source.PORT?.trim()),
    googleClientId: source.GOOGLE_CLIENT_ID?.trim(),
    googleClientSecret: source.GOOGLE_CLIENT_SECRET?.trim(),
    googleRedirectUri: source.GOOGLE_REDIRECT_URI?.trim(),
    googleTokenEncryptionKey: source.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim(),
  };
}

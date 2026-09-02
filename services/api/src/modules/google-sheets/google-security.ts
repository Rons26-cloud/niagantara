import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

export const REQUIRED_GOOGLE_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/spreadsheets',
] as const;

export function hashOAuthState(state: string) {
  return createHash('sha256').update(state).digest('hex');
}

function encryptionKey(secret: string) {
  if (secret.length < 32)
    throw new Error(
      'GOOGLE_TOKEN_ENCRYPTION_KEY must contain at least 32 characters.',
    );
  return createHash('sha256').update(secret).digest();
}

export function encryptToken(value: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  return [
    'v1',
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptToken(value: string, secret: string) {
  const [version, iv, tag, encrypted] = value.split('.');
  if (version !== 'v1' || !iv || !tag || !encrypted)
    throw new Error('Invalid encrypted token.');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(secret),
    Buffer.from(iv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function safeSheetValue(value: unknown): string | number | boolean {
  if (typeof value === 'number') return Number.isFinite(value) ? value : '';
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return '';
  const text = String(value).replace(
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,
    '',
  );
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

const forbiddenFormula =
  /\b(IMPORTRANGE|IMPORTXML|IMPORTHTML|IMPORTDATA|GOOGLEFINANCE|HYPERLINK|WEBSERVICE)\b/i;
export function validateFormulaTemplate(formula: string) {
  if (
    !formula.startsWith('=') ||
    formula.length > 500 ||
    forbiddenFormula.test(formula)
  ) {
    throw new Error('UNSAFE_FORMULA');
  }
  if (!/^=[A-Z0-9_()+\-*/.,:$ <>="']+$/i.test(formula))
    throw new Error('UNSAFE_FORMULA');
  return formula;
}

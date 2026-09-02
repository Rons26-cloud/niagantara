import { Injectable } from '@nestjs/common';
import { validateServerEnvironment } from '../../config/environment.js';
import { decryptToken, REQUIRED_GOOGLE_SCOPES } from './google-security.js';

export class GoogleConfigurationError extends Error {
  readonly code = 'GOOGLE_OAUTH_NOT_CONFIGURED';
}
export class GoogleApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}
type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  id_token?: string;
};

export type GoogleAuthorizationConfig = {
  clientId: string;
  redirectUri: string;
  forceConsent?: boolean;
};
export function buildGoogleAuthorizationUrl(
  config: GoogleAuthorizationConfig,
  state: string,
) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', REQUIRED_GOOGLE_SCOPES.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('include_granted_scopes', 'true');
  if (config.forceConsent) url.searchParams.set('prompt', 'consent');
  return url.toString();
}

@Injectable()
export class GoogleClient {
  private config() {
    const e = validateServerEnvironment();
    if (
      !e.googleClientId ||
      !e.googleClientSecret ||
      !e.googleRedirectUri ||
      !e.googleTokenEncryptionKey
    )
      throw new GoogleConfigurationError(
        'Google OAuth environment is not configured.',
      );
    return e;
  }
  authorizationUrl(state: string) {
    const e = this.config();
    return buildGoogleAuthorizationUrl(
      {
        clientId: e.googleClientId!,
        redirectUri: e.googleRedirectUri!,
        forceConsent: true,
      },
      state,
    );
  }
  async exchange(code: string) {
    const e = this.config();
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: e.googleClientId!,
        client_secret: e.googleClientSecret!,
        redirect_uri: e.googleRedirectUri!,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(e.googleTimeoutMs),
    });
    return this.parse<TokenResponse>(response);
  }
  async accessToken(encryptedRefreshToken: string) {
    const e = this.config();
    const refreshToken = decryptToken(
      encryptedRefreshToken,
      e.googleTokenEncryptionKey!,
    );
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: e.googleClientId!,
        client_secret: e.googleClientSecret!,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(e.googleTimeoutMs),
    });
    return (await this.parse<TokenResponse>(response)).access_token;
  }
  async userInfo(accessToken: string) {
    return this.request<{ sub: string; email: string }>(
      'https://openidconnect.googleapis.com/v1/userinfo',
      accessToken,
    );
  }
  async createSpreadsheet(accessToken: string, title: string) {
    return this.request<{ spreadsheetId: string; spreadsheetUrl: string }>(
      'https://sheets.googleapis.com/v4/spreadsheets',
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          properties: { title, timeZone: 'Asia/Jakarta' },
        }),
      },
    );
  }
  async batchUpdate(
    accessToken: string,
    spreadsheetId: string,
    requests: unknown[],
  ) {
    return this.request(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
      accessToken,
      { method: 'POST', body: JSON.stringify({ requests }) },
    );
  }
  async writeRows(
    accessToken: string,
    spreadsheetId: string,
    range: string,
    values: (string | number | boolean)[][],
  ) {
    return this.request(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({ majorDimension: 'ROWS', values }),
      },
    );
  }
  private async request<T = unknown>(
    url: string,
    token: string,
    init: RequestInit = {},
  ) {
    const e = this.config();
    const response = await fetch(url, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(e.googleTimeoutMs),
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        ...init.headers,
      },
    });
    return this.parse<T>(response);
  }
  private async parse<T>(response: Response): Promise<T> {
    const body: any = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code =
        body.error?.status || body.error || `GOOGLE_HTTP_${response.status}`;
      throw new GoogleApiError(
        response.status,
        String(code),
        body.error?.message || 'Google API request failed.',
        [408, 429, 500, 502, 503, 504].includes(response.status),
      );
    }
    return body as T;
  }
}

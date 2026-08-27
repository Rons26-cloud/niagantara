const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://niagantara-production.up.railway.app/api/v1' : '/api/v1');

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export async function api<T>(
  path: string,
  token: string,
  companyId?: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...(companyId ? { 'x-company-id': companyId } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(response.status, (body as any).code ?? 'REQUEST_FAILED');
  return body as T;
}

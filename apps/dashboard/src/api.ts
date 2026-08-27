const apiBase =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://niagantara-production.up.railway.app/api/v1'
    : '/api/v1');
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
) {
  const storedBranch =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('niagantara.active-branch')
      : null;
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...(companyId ? { 'x-company-id': companyId } : {}),
      ...(storedBranch ? { 'x-branch-id': storedBranch } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(response.status, body.code ?? 'REQUEST_FAILED');
  return body as T;
}
export async function login(email: string, password: string) {
  const response = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(response.status, body.code ?? 'LOGIN_FAILED');
  return body;
}

export async function register(payload: {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
}) {
  const response = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(response.status, body.code ?? 'REGISTER_FAILED');
  return body;
}

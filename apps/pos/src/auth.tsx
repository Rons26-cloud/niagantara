import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError } from './api';

export type SessionUser = { id: string; email?: string };

type AuthState = {
  user: SessionUser | null;
  accessToken: string | null;
  setSession: (user: SessionUser, token: string) => void;
  clearSession: () => void;
};

const KEY = 'niagantara.pos.session.v1';

const saved = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
  } catch {
    return null;
  }
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = saved();
  const [user, setUser] = useState<SessionUser | null>(initial?.user ?? null);
  const [accessToken, setToken] = useState<string | null>(
    initial?.accessToken ?? null,
  );
  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        setSession: (u, t) => {
          setUser(u);
          setToken(t);
          sessionStorage.setItem(
            KEY,
            JSON.stringify({ user: u, accessToken: t }),
          );
        },
        clearSession: () => {
          setUser(null);
          setToken(null);
          sessionStorage.removeItem(KEY);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be inside AuthProvider');
  return value;
}

export async function login(email: string, password: string) {
  const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://niagantara-production.up.railway.app/api/v1' : '/api/v1')}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(response.status, body.code ?? 'LOGIN_FAILED');
  return body as { user: SessionUser; accessToken: string };
}

export type MeCtx = {
  active_company: string;
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

export function useCompanyContext(token: string | null) {
  const [ctx, setCtx] = useState<MeCtx | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'denied' | 'error'>('loading');
  useEffect(() => {
    if (!token) return;
    api<MeCtx>('/auth/me', token)
      .then((v) => {
        if (!v.active_company) {
          setStatus('error');
          return;
        }
        setCtx(v);
        setStatus('ready');
      })
      .catch((e) =>
        setStatus(e instanceof ApiError && e.status === 403 ? 'denied' : 'error'),
      );
  }, [token]);
  return { ctx, status };
}

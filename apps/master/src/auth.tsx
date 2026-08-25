import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type SessionUser = { id: string; email?: string };

type AuthState = {
  user: SessionUser | null;
  accessToken: string | null;
  platformRole: string | null;
  setSession: (user: SessionUser, token: string) => void;
  clearSession: () => void;
};

const KEY = 'niagantara.master.session.v1';
export const PLATFORM_ROLES = ['super_master', 'master_admin', 'support', 'auditor'];

const saved = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
  } catch {
    return null;
  }
};

export function readPlatformRole(jwt: string | null): string | null {
  if (!jwt) return null;
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const role = payload?.app_metadata?.platform_role;
    return typeof role === 'string' && PLATFORM_ROLES.includes(role) ? role : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = saved();
  const [user, setUser] = useState<SessionUser | null>(initial?.user ?? null);
  const [accessToken, setToken] = useState<string | null>(initial?.accessToken ?? null);
  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        platformRole: readPlatformRole(accessToken),
        setSession: (u, t) => {
          setUser(u);
          setToken(t);
          sessionStorage.setItem(KEY, JSON.stringify({ user: u, accessToken: t }));
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
  const base = import.meta.env.VITE_API_URL || '/api/v1';
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.code ?? 'LOGIN_FAILED');
  return body as { user: SessionUser; accessToken: string };
}

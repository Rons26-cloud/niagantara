import { createClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
export type SessionUser = { id: string; email?: string };
type AuthState = {
  user: SessionUser | null;
  accessToken: string | null;
  setSession: (user: SessionUser, token: string, refreshToken?: string) => void;
  clearSession: () => void;
};
const KEY = 'niagantara.dashboard.session.v1';
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
  const realtimeAuth = useRef(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
      ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
          auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false },
        })
      : null,
  );
  useEffect(() => {
    const client = realtimeAuth.current;
    if (!client) return;
    if (initial?.accessToken && initial?.refreshToken) {
      void client.auth.setSession({ access_token: initial.accessToken, refresh_token: initial.refreshToken });
    }
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!session?.access_token) return;
      setToken(session.access_token);
      const current = saved();
      sessionStorage.setItem(KEY, JSON.stringify({ user: current?.user ?? user, accessToken: session.access_token, refreshToken: session.refresh_token }));
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        setSession: (u, t, refreshToken) => {
          setUser(u);
          setToken(t);
          sessionStorage.setItem(
            KEY,
            JSON.stringify({ user: u, accessToken: t, refreshToken }),
          );
          if (refreshToken) void realtimeAuth.current?.auth.setSession({ access_token: t, refresh_token: refreshToken });
        },
        clearSession: () => {
          setUser(null);
          setToken(null);
          sessionStorage.removeItem(KEY);
          void realtimeAuth.current?.auth.signOut({ scope: 'local' });
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

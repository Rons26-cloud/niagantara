import { createClient } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { isTokenExpired, onUnauthorized } from '../api';
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
    const value = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (!value?.accessToken || isTokenExpired(value.accessToken)) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return value;
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
  const refreshToken = useRef<string | null>(null);
  const realtimeAuth = useRef(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
      ? createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: true,
              detectSessionInUrl: false,
            },
          },
        )
      : null,
  );
  const clearSession = () => {
    setUser(null);
    setToken(null);
    refreshToken.current = null;
    sessionStorage.removeItem(KEY);
    void realtimeAuth.current?.auth.signOut({ scope: 'local' });
  };
  useEffect(() => {
    const client = realtimeAuth.current;
    if (client && initial?.accessToken && refreshToken.current) {
      void client.auth.setSession({
        access_token: initial.accessToken,
        refresh_token: refreshToken.current,
      });
    }
    const unsubscribe = onUnauthorized(() => clearSession());
    const { data } = client?.auth.onAuthStateChange((_event, session) => {
      if (!session?.access_token) return;
      refreshToken.current = session.refresh_token ?? refreshToken.current;
      setToken(session.access_token);
      const current = saved();
      const storedUser = current?.user ?? user;
      sessionStorage.setItem(
        KEY,
        JSON.stringify({ user: storedUser, accessToken: session.access_token }),
      );
    }) ?? { data: { subscription: { unsubscribe: () => undefined } } };
    return () => {
      unsubscribe();
      data.subscription.unsubscribe();
    };
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        setSession: (u, t, refresh) => {
          setUser(u);
          setToken(t);
          refreshToken.current = refresh ?? refreshToken.current;
          sessionStorage.setItem(
            KEY,
            JSON.stringify({ user: u, accessToken: t }),
          );
          if (refresh)
            void realtimeAuth.current?.auth.setSession({
              access_token: t,
              refresh_token: refresh,
            });
        },
        clearSession,
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

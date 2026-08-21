import { createContext, useContext, useState, ReactNode } from 'react';
export type SessionUser = { id: string; email?: string };
type AuthState = {
  user: SessionUser | null;
  accessToken: string | null;
  setSession: (user: SessionUser, token: string) => void;
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

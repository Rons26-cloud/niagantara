import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from './api';
import { login, useAuth, type SessionUser } from './auth';
import {
  BrandLogo,
  BrandMark,
  Button,
  ErrorState,
  Field,
  Input,
  LanguageSwitcher,
  LoadingState,
  Select,
  SidebarIcon,
  ThemeSwitcher,
  useTranslation,
  LoginBrand,
  POS_NAV_ICONS,
} from '@niagantara/ui';
import '@niagantara/ui/design-tokens.css';
import '@niagantara/ui/components.css';
import '@niagantara/ui/ui.css';
import { PosPage, PosHistory } from '@niagantara/pos-core';
import './app.css';

const BRANCH_KEY = 'niagantara.pos.branch';

type PosPage = 'pos' | 'settings' | 'history';

const POS_NAV: [PosPage, string][] = [
  ['pos', 'Kasir'],
  ['history', 'Riwayat'],
  ['settings', 'Pengaturan'],
];

export function PosApp() {
  const { user, accessToken, setSession, clearSession } = useAuth();
  const { t } = useTranslation();
  const [ctx, setCtx] = useState<any>(null);
  const [status, setStatus] = useState<
    'loading' | 'ready' | 'denied' | 'expired' | 'error' | 'noctx'
  >('loading');
  const [branchId, setBranchId] = useState(
    () => sessionStorage.getItem(BRANCH_KEY) ?? '',
  );
  const [activePage, setActivePage] = useState<PosPage>('pos');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('niagantara.pos.sidebar.collapsed') === 'true';
  });

  useEffect(() => {
    if (!accessToken) return;
    let alive = true;
    api2<any>('/auth/me', accessToken)
      .then((me) => {
        if (!alive) return;
        if (!me.active_company || !me.accessible_branches?.length) {
          setStatus(
            me.permissions?.includes('pos.access') ? 'noctx' : 'denied',
          );
          return;
        }
        setCtx(me);
        setStatus('ready');
      })
      .catch((e) => {
        if (!alive) return;
        setStatus(
          e instanceof ApiError && e.status === 403
            ? 'denied'
            : e instanceof ApiError && e.status === 401
              ? 'expired'
              : 'error',
        );
      });
    return () => {
      alive = false;
    };
  }, [accessToken]);

  if (!user) return <PosLogin onLogin={setSession} />;

  const branch =
    ctx?.accessible_branches?.find((b: any) => b.id === branchId) ??
    ctx?.accessible_branches?.[0];
  const store =
    ctx?.stores?.find((s: any) => s.id === branch?.store_id) ??
    ctx?.stores?.[0];

  const userInitials = String(user?.email ?? 'P')
    .split('@')[0]
    .split('.')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const toggleSidebar = () => {
    setSidebarCollapsed((v) => {
      const next = !v;
      localStorage.setItem('niagantara.pos.sidebar.collapsed', String(next));
      return next;
    });
  };

  return (
    <div
      className={`pos-shell${sidebarCollapsed ? ' pos-sidebar-collapsed' : ''}`}
    >
      <aside className="pos-sidebar">
        <div className="pos-sidebar-brand">
          <BrandLogo compact href="#" className="pos-sidebar-full" />
          <BrandMark size={28} className="pos-sidebar-mark" />
          <button
            className="pos-sidebar-collapse"
            type="button"
            aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        {status === 'ready' && ctx && (
          <div className="pos-sidebar-branch">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <select
              value={branch?.id ?? ''}
              onChange={(e) => {
                setBranchId(e.target.value);
                sessionStorage.setItem(BRANCH_KEY, e.target.value);
              }}
            >
              {(ctx.accessible_branches as any[]).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="pos-sidebar-nav">
          {POS_NAV.map(([id, label]) => {
            const Icon = POS_NAV_ICONS[id];
            return (
              <button
                key={id}
                className={activePage === id ? 'active' : ''}
                onClick={() => setActivePage(id)}
              >
                {Icon && <SidebarIcon icon={Icon} size={18} />}
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="pos-sidebar-footer">
          <div className="pos-sidebar-controls">
            <ThemeSwitcher />
            <LanguageSwitcher compact />
          </div>
          <div className="pos-sidebar-user">
            <span className="pos-sidebar-user-avatar">{userInitials}</span>
            <span className="pos-sidebar-user-info">
              <b>{user?.email ?? 'Kasir'}</b>
              {branch?.name && <small>{branch.name}</small>}
            </span>
          </div>
          <button
            className="pos-sidebar-logout"
            onClick={() => {
              clearSession();
              location.reload();
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </aside>

      <main className="pos-main">
        {status === 'loading' && (
          <LoadingState label={t('dashboard.loadingContext')} />
        )}
        {status === 'denied' && (
          <ErrorState message={t('dashboard.permissionDenied')} />
        )}
        {status === 'expired' && (
          <ErrorState
            message="Sesi POS berakhir. Silakan masuk kembali."
            onRetry={() => {
              clearSession();
              location.reload();
            }}
          />
        )}
        {status === 'noctx' && (
          <ErrorState
            message={
              'Tidak ada cabang aktif untuk akun ini. Hubungi pemilik toko untuk penempatan cabang.'
            }
          />
        )}
        {status === 'error' && (
          <ErrorState
            message={t('dashboard.loadError')}
            onRetry={() => location.reload()}
          />
        )}
        {status === 'ready' &&
          ctx &&
          branch &&
          activePage === 'pos' &&
          (ctx.permissions.includes('pos.access') ? (
            <PosPage
              company={ctx.active_company}
              token={accessToken!}
              userId={user.id}
              ctx={{
                permissions: ctx.permissions,
                stores: store ? [store] : [],
                accessible_branches: [branch],
              }}
            />
          ) : (
            <ErrorState message={t('dashboard.permissionDenied')} />
          ))}
        {status === 'ready' && activePage === 'history' && (
          <PosHistory
            company={ctx.active_company}
            token={accessToken!}
            branchId={branch.id}
          />
        )}
        {status === 'ready' && activePage === 'settings' && (
          <div className="pos-gap-page">
            <h2>Pengaturan POS</h2>
            <p>Fitur ini akan segera tersedia.</p>
          </div>
        )}
      </main>
    </div>
  );
}

async function api2<T>(path: string, token: string): Promise<T> {
  const base =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? 'https://niagantara-production.up.railway.app/api/v1'
      : '/api/v1');
  const res = await fetch(`${base}${path}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.code ?? 'REQUEST_FAILED');
  return body as T;
}

function PosLogin({
  onLogin,
}: {
  onLogin: (u: SessionUser, token: string) => void;
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(email, password);
      onLogin(result.user, result.accessToken);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Email atau kata sandi salah.'
          : 'Login gagal.',
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="pos-login">
      <LoginBrand appLabel="POS / Kasir" />
      <form onSubmit={submit}>
        <Field label={t('auth.email')}>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label={t('auth.password')}>
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && (
          <p className="pos-login__error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" loading={loading}>
          {t('auth.signIn')}
        </Button>
      </form>
    </div>
  );
}

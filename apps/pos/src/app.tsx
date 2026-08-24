import { FormEvent, useEffect, useState } from 'react';
import { ApiError } from './api';
import { login, useAuth, type SessionUser } from './auth';
import {
  BrandLogo,
  Button,
  ErrorState,
  Field,
  Input,
  LanguageSwitcher,
  LoadingState,
  Select,
  ThemeSwitcher,
  useTranslation,
} from '@niagantara/ui';
import '@niagantara/ui/design-tokens.css';
import '@niagantara/ui/components.css';
import '@niagantara/ui/ui.css';
import { PosPage } from '@niagantara/pos-core';
import './app.css';

const BRANCH_KEY = 'niagantara.pos.branch';

export function PosApp() {
  const { user, accessToken, setSession, clearSession } = useAuth();
  const { t } = useTranslation();
  const [ctx, setCtx] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'denied' | 'error' | 'noctx'>(
    'loading',
  );
  const [branchId, setBranchId] = useState(
    () => sessionStorage.getItem(BRANCH_KEY) ?? '',
  );

  useEffect(() => {
    if (!accessToken) return;
    let alive = true;
    api2<any>('/auth/me', accessToken)
      .then((me) => {
        if (!alive) return;
        if (!me.active_company || !me.accessible_branches?.length) {
          setStatus(me.permissions?.includes('pos.access') ? 'noctx' : 'denied');
          return;
        }
        setCtx(me);
        setStatus('ready');
      })
      .catch((e) => {
        if (!alive) return;
        setStatus(e instanceof ApiError && e.status === 403 ? 'denied' : 'error');
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
    ctx?.stores?.find((s: any) => s.id === branch?.store_id) ?? ctx?.stores?.[0];

  return (
    <div className="pos-shell">
      <header className="pos-topbar">
        <BrandLogo compact href="#" />
        {status === 'ready' && ctx && (
          <label className="pos-branch">
            <span>{t('context.branch')}</span>
            <Select
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
            </Select>
          </label>
        )}
        <div className="pos-topbar__controls">
          <ThemeSwitcher />
          <LanguageSwitcher compact />
          <Button variant="ghost" onClick={() => { clearSession(); location.reload(); }}>
            {t('auth.logout')}
          </Button>
        </div>
      </header>

      <main className="pos-main">
        {status === 'loading' && <LoadingState label={t('dashboard.loadingContext')} />}
        {status === 'denied' && <ErrorState message={t('dashboard.permissionDenied')} />}
        {status === 'noctx' && (
          <ErrorState
            message={
              'Tidak ada cabang aktif untuk akun ini. Hubungi pemilik toko untuk penempatan cabang.'
            }
          />
        )}
        {status === 'error' && (
          <ErrorState message={t('dashboard.loadError')} onRetry={() => location.reload()} />
        )}
        {status === 'ready' && ctx && branch &&
          (ctx.permissions.includes('pos.access') ? (
            <PosPage
              company={ctx.active_company}
              token={accessToken!}
              ctx={{
                permissions: ctx.permissions,
                stores: store ? [store] : [],
                accessible_branches: [branch],
              }}
            />
          ) : (
            <ErrorState message={t('dashboard.permissionDenied')} />
          ))}
      </main>
    </div>
  );
}

async function api2<T>(path: string, token: string): Promise<T> {
  const base = import.meta.env.VITE_API_URL || '/api/v1';
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
      <BrandLogo href="#" />
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

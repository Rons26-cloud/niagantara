import { FormEvent, useEffect, useState } from 'react';
import { login, useAuth, PLATFORM_ROLES, type SessionUser } from './auth';
import {
  Alert,
  BrandLogo,
  BrandMark,
  Button,
  ErrorState,
  Field,
  Input,
  LanguageSwitcher,
  StatCard,
  ThemeSwitcher,
  useTranslation,
} from '@niagantara/ui';
import '@niagantara/ui/design-tokens.css';
import '@niagantara/ui/components.css';
import '@niagantara/ui/ui.css';
import './app.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

/* Modules with no platform API yet: routed to honest gap pages (no mocks). */
const GAP_MODULES: Record<string, string> = {
  companies: 'master.companies',
  users: 'master.users',
  subscription: 'master.subscription',
  billing: 'master.billing',
  releases: 'master.releases',
  versions: 'master.versions',
  'feature-flags': 'master.featureFlags',
  rollout: 'master.rollout',
  maintenance: 'master.maintenance',
  announcements: 'master.announcements',
  'mobile-versions': 'master.mobileVersions',
};

type Health = {
  status: string;
  service?: string;
  api_version?: string;
  app_version?: string;
  build_sha?: string;
  environment?: string;
};
type Readiness = Health & { database?: string };

function useHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [error, setError] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const [h, r] = await Promise.all([
          fetch(`${API_BASE}/health`).then((x) => x.json()),
          fetch(`${API_BASE}/health/readiness`).then((x) => x.json()),
        ]);
        if (!alive) return;
        setHealth(h);
        setReadiness(r.status ? r : { status: 'not_ready', ...r });
        setError(false);
      } catch {
        if (alive) setError(true);
      }
      if (alive) setCheckedAt(new Date());
    };
    void tick();
    const id = setInterval(tick, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  return { health, readiness, error, checkedAt };
}

export function MasterApp() {
  const { user, platformRole, clearSession, setSession } = useAuth();
  const { t } = useTranslation();
  const healthHook = useHealth();
  const [page, setPage] = useState(
    location.hash.replace(/^#\/?/, '') || 'dashboard',
  );
  useEffect(() => {
    const onHash = () => setPage(location.hash.replace(/^#\/?/, '') || 'dashboard');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (!user) return <MasterLogin onLogin={setSession} />;

  const go = (id: string) => {
    location.hash = `#/${id}`;
    setPage(id);
  };

  const navLink = (id: string, icon: string, label: string) => (
    <a
      key={id}
      href={`#/${id}`}
      className={page === id ? 'active' : ''}
      aria-current={page === id ? 'page' : undefined}
      onClick={() => go(id)}
    >
      {icon} {label}
    </a>
  );

  return (
    <div className="mshell">
      <aside className="msidebar">
        <div className="msidebar-brand brand-chip">
          <BrandLogo href="#/dashboard" className="msidebar-full" />
          <BrandMark size={30} className="msidebar-mark" />
        </div>
        <p className="eyebrow">{t('master.control')}</p>
        <nav aria-label={t('nav.primary')}>
          <span className="mnav-group">{t('master.dashboardNav')}</span>
          {navLink('dashboard', '◈', t('pages.dashboard'))}
          <span className="mnav-group">{t('master.platformNav')}</span>
          {navLink('companies', '▣', t('master.companies'))}
          {navLink('users', '◍', t('master.users'))}
          {navLink('subscription', '▤', t('master.subscription'))}
          {navLink('billing', '▥', t('master.billing'))}
          <span className="mnav-group">{t('master.systemManagement')}</span>
          {navLink('system-health', '♥', t('master.systemHealth'))}
          {navLink('releases', '⬒', t('master.releases'))}
          {navLink('versions', '⬓', t('master.versions'))}
          {navLink('feature-flags', '⚑', t('master.featureFlags'))}
          {navLink('rollout', '◔', t('master.rollout'))}
          {navLink('maintenance', '⚒', t('master.maintenance'))}
          {navLink('announcements', '✦', t('master.announcements'))}
          {navLink('mobile-versions', '▦', t('master.mobileVersions'))}
          <span className="mnav-group">{t('master.securityNav')}</span>
          {navLink('security', '♦', t('master.auditLog'))}
          <span className="mnav-group">{t('master.operationsNav')}</span>
          {navLink('operations', '⌁', t('master.sheets.title'))}
        </nav>
        <div className="msidebar__foot">
          <div className="msidebar__controls">
            <ThemeSwitcher />
            <LanguageSwitcher compact />
          </div>
          {platformRole && (
            <code className="role-chip" title={platformRole}>
              {platformRole}
            </code>
          )}
          <Button variant="ghost" onClick={() => { clearSession(); location.hash = ''; }}>
            {t('auth.logout')}
          </Button>
        </div>
      </aside>

      <main className="mworkspace">
        {!PLATFORM_ROLES.includes(platformRole ?? '') ? (
          <ErrorState message={t('master.accessDenied')} />
        ) : page === 'system-health' ? (
          <SystemHealthPage />
        ) : page === 'security' ? (
          <GapPage title={t('master.auditLog')} items={[t('master.auditLog'), t('master.securityEvents'), t('master.systemActivity')]} />
        ) : page === 'operations' ? (
          <GapPage title={t('master.sheets.title')} items={[t('master.sheetsHealth'), t('master.workerHealth'), t('master.emailHealth')]} note={t('master.sheets.note')} />
        ) : GAP_MODULES[page] ? (
          <GapPage title={t(GAP_MODULES[page])} items={[t(GAP_MODULES[page])]} />
        ) : (
          <MasterHome healthHook={healthHook} />
        )}
      </main>
    </div>
  );
}

function MasterHome({
  healthHook,
}: {
  healthHook: ReturnType<typeof useHealth>;
}) {
  const { t } = useTranslation();
  const { health, readiness, error, checkedAt } = healthHook;
  const apiOk = !!health && !error;
  const dbOk = readiness?.database === 'reachable';
  return (
    <>
      <header className="mpage-head">
        <h1>{t('master.title')}</h1>
        <p>{health?.service ? `${health.service} · ${health.environment ?? ''}` : t('master.tagline')}</p>
      </header>
      <section className="mkpis">
        <StatCard label={t('master.apiHealth')} value={apiOk ? t('master.operational') : error ? t('master.down') : '…'} tone={apiOk ? 'success' : 'danger'} loading={!checkedAt && !error} note={health?.app_version} />
        <StatCard label={t('master.databaseHealth')} value={dbOk ? t('master.operational') : readiness ? t('master.down') : '…'} tone={dbOk ? 'success' : 'danger'} loading={!checkedAt && !error} note={readiness?.status} />
        <StatCard label={t('master.companies')} value={t('master.notConfigured')} note={t('master.backendGap')} />
        <StatCard label={t('master.users')} value={t('master.notConfigured')} note={t('master.backendGap')} />
        <StatCard label={t('master.subscription')} value={t('master.notConfigured')} note={t('master.backendGap')} />
        <StatCard label={t('master.branches')} value={t('master.notConfigured')} note={t('master.backendGap')} />
      </section>
      <Alert tone="warning">{t('master.backendGap')}</Alert>
      <section className="mgap-grid">
        <GapPanel title={t('master.billing')} />
        <GapPanel title={t('master.releases')} />
        <GapPanel title={t('master.featureFlags')} />
        <GapPanel title={t('master.announcements')} />
        <GapPanel title={t('master.maintenance')} />
        <GapPanel title={t('master.mobileVersions')} />
      </section>
      {checkedAt && (
        <p className="muted mchecked">
          {t('master.lastChecked')}: {checkedAt.toLocaleTimeString()} · {t('master.autoRefresh')}
        </p>
      )}
    </>
  );
}

function SystemHealthPage() {
  const { t } = useTranslation();
  const { health, readiness, error, checkedAt } = useHealth();
  return (
    <>
      <header className="mpage-head">
        <h1>{t('master.systemHealth')}</h1>
        <p>{t('master.autoRefresh')}</p>
      </header>
      <section className="mkpis">
        <StatCard label="/health" value={error ? t('master.down') : String(health?.status ?? '…')} tone={error ? 'danger' : 'success'} note={health?.build_sha?.slice(0, 7)} />
        <StatCard label="/health/readiness" value={String(readiness?.status ?? (error ? t('master.down') : '…'))} tone={readiness?.status === 'ready' ? 'success' : 'danger'} note={readiness?.database} />
        <StatCard label={t('master.workerHealth')} value={t('master.notConfigured')} note={t('master.backendGap')} />
        <StatCard label={t('master.emailHealth')} value={t('master.notConfigured')} note={t('master.backendGap')} />
      </section>
      {checkedAt && (
        <p className="muted mchecked">
          {t('master.lastChecked')}: {checkedAt.toLocaleTimeString()}
        </p>
      )}
    </>
  );
}

function GapPage({ title, items, note }: { title: string; items: string[]; note?: string }) {
  const { t } = useTranslation();
  return (
    <>
      <header className="mpage-head">
        <h1>{title}</h1>
      </header>
      <Alert tone="info" >{note ?? t('master.backendGap')}</Alert>
      <section className="mgap-grid">
        {items.map((i) => (
          <GapPanel key={i} title={i} />
        ))}
      </section>
    </>
  );
}

function GapPanel({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <article className="mgap">
      <h2>{title}</h2>
      <p>{t('master.backendGap')}</p>
    </article>
  );
}

function MasterLogin({
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
    } catch {
      setError(t('auth.error'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="mlogin">
      <BrandLogo href="#" />
      <p className="eyebrow">{t('master.signIn')}</p>
      <p className="hint">{t('master.signInHint')}</p>
      <form onSubmit={submit}>
        <Field label={t('auth.email')}>
          <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label={t('auth.password')}>
          <Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && (
          <p role="alert" style={{ color: '#ef4444', fontSize: 13 }}>
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


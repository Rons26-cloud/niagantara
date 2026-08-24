import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, api } from './api';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Select,
  StatCard,
  StatusBadge,
  Switch as ThemeSwitchControl,
} from '@niagantara/ui';
import type { Language, Theme } from '@niagantara/ui';
import { getLanguage, getTheme, setLanguage, setTheme, useTranslation } from '@niagantara/ui';

export type OrgCtx = {
  user: { id: string };
  profile: any;
  companies: any[];
  active_company: string;
  roles: string[];
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

const BRANCH_KEY = 'niagantara.active-branch';

export function loadStoredBranch(): string | null {
  try {
    return sessionStorage.getItem(BRANCH_KEY);
  } catch {
    return null;
  }
}

export function storeBranch(id: string) {
  try {
    sessionStorage.setItem(BRANCH_KEY, id);
  } catch {
    /* storage unavailable */
  }
}

/** Independent async data hook: never lets one failure poison siblings (Phase 34 root-cause fix). */
export function useResource<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
): { data: T | null; loading: boolean; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetcher()
      .then((v) => alive && setData(v))
      .catch((e) => alive && setError(describeError(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, loading, error, reload };
}

export function describeError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 403) return '403 · permission denied';
    if (e.status === 404) return '404 · not found';
    if (e.status >= 500) return `${e.status} · server error`;
    return `${e.status} · ${e.code}`;
  }
  return 'network error';
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

/* ---------------- Dashboard home ---------------- */

type Sale = {
  id: string;
  status: string;
  grand_total: number;
  refunded_total?: number;
  created_at: string;
  items?: { product_id: string; product_name: string; quantity: number; line_total: number }[];
};

export function DashboardHome({
  company,
  token,
  ctx,
  branch,
  go,
}: {
  company: string;
  token: string;
  ctx: OrgCtx;
  branch: any;
  go: (page: string) => void;
}) {
  const { t } = useTranslation();
  const [from, setFrom] = useState(isoDay(new Date()));
  const [to, setTo] = useState(isoDay(new Date()));

  const can = (p: string) => ctx.permissions.includes(p);

  const sales = useResource<Sale[]>(
    () => api<Sale[]>(`/sales?from=${from}&to=${to}`, token, company),
    [company, token, from, to],
  );
  const lowStock = useResource<any[]>(
    () => api<any[]>('/inventory/low-stock', token, company),
    [company, token],
  );
  const finance = useResource<any>(() => api('/finance/reports', token, company), [company, token]);
  const sheets = useResource<any>(
    () => (can('sheet.read') ? api<any>('/google-sheets', token, company) : Promise.resolve(null)),
    [company, token],
  );

  const paidSales = useMemo(
    () =>
      (sales.data ?? []).filter((s) =>
        ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(s.status),
      ),
    [sales.data],
  );
  const revenue = useMemo(
    () =>
      paidSales.reduce(
        (sum, s) => sum + Number(s.grand_total) - Number(s.refunded_total ?? 0),
        0,
      ),
    [paidSales],
  );

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const s of paidSales)
      for (const item of s.items ?? []) {
        const cur = map.get(item.product_id) ?? {
          name: item.product_name,
          qty: 0,
          revenue: 0,
        };
        cur.qty += Number(item.quantity);
        cur.revenue += Number(item.line_total);
        map.set(item.product_id, cur);
      }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [paidSales]);

  const dailySeries = useMemo(() => {
    const start = new Date(from);
    const end = new Date(to);
    const days: { day: string; total: number }[] = [];
    for (let d = new Date(start); d <= end && days.length < 62; d.setDate(d.getDate() + 1)) {
      const key = isoDay(d);
      const total = paidSales
        .filter((s) => s.created_at.slice(0, 10) === key)
        .reduce((n, s) => n + Number(s.grand_total), 0);
      days.push({ day: key.slice(5), total });
    }
    return days;
  }, [from, to, paidSales]);

  const fmtRp = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

  const statusDistribution = useMemo(() => {
    const all = sales.data ?? [];
    const counts = new Map<string, number>();
    for (const s of all) counts.set(s.status, (counts.get(s.status) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({
        status,
        count,
        share: all.length ? Math.round((count / all.length) * 100) : 0,
      }));
  }, [sales.data]);

  return (
    <>
      <div className="ng-filterbar">
        <Field label={t('common.date')}>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="→">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        {ctx.accessible_branches.length > 0 && (
          <div className="ng-filterbar__context">
            <Badge tone="info">
              {t('context.branch')}: {branch?.name ?? t('context.allBranches')}
            </Badge>
          </div>
        )}
      </div>

      <div className="metrics">
        <StatCard
          label={t('dashboard.todaySales')}
          value={fmtRp(revenue)}
          note="net paid"
          loading={sales.loading}
          error={!!sales.error}
          onRetry={sales.reload}
        />
        <StatCard
          label={t('dashboard.todayTransactions')}
          value={String(paidSales.length)}
          note="PAID"
          loading={sales.loading}
          error={!!sales.error}
          onRetry={sales.reload}
        />
        <StatCard
          label={t('dashboard.lowStock')}
          value={String(lowStock.data?.length ?? 0)}
          note="≤ minimum"
          tone={lowStock.data?.length ? 'warning' : 'default'}
          loading={lowStock.loading}
          error={!!lowStock.error}
          onRetry={lowStock.reload}
        />
        <StatCard
          label={t('dashboard.averageTransaction')}
          value={fmtRp(paidSales.length ? revenue / paidSales.length : 0)}
          loading={sales.loading}
          error={!!sales.error}
          onRetry={sales.reload}
        />
      </div>

      {(can('finance.read') || can('payable.read') || can('receivable.read')) && (
        <div className="metrics metrics--finance">
          <StatCard
            label={t('website.finance.revenue') || 'Revenue'}
            value={fmtRp(Number(finance.data?.revenue ?? 0))}
            loading={finance.loading}
            error={!!finance.error}
            onRetry={finance.reload}
          />
          <StatCard
            label="Expenses"
            value={fmtRp(Number(finance.data?.expenses ?? 0))}
            loading={finance.loading}
            error={!!finance.error}
            onRetry={finance.reload}
          />
          <StatCard
            label={t('pages.payables')}
            value={
              finance.loading
                ? ''
                : fmtRp(Number(finance.data?.purchases ?? 0))
            }
            note="period purchases"
            loading={finance.loading}
            error={!!finance.error}
            onRetry={finance.reload}
          />
          <StatCard
            label="Operating cash result"
            value={fmtRp(Number(finance.data?.operatingCashResult ?? 0))}
            tone={Number(finance.data?.operatingCashResult ?? 0) >= 0 ? 'success' : 'danger'}
            loading={finance.loading}
            error={!!finance.error}
            onRetry={finance.reload}
          />
        </div>
      )}

      <div className="dash-columns">
        <Card title="Penjualan / Sales trend">
          {dailySeries.length > 1 ? (
            <MiniBars data={dailySeries.map((d) => ({ label: d.day, value: d.total }))} />
          ) : (
            <p className="muted">Pilih rentang tanggal lebih dari satu hari.</p>
          )}
        </Card>

        <Card title="Quick actions">
          <div className="quick-actions">
            {can('pos.access') && (
              <Button onClick={() => go('pos')}>▦ {t('pages.pos')}</Button>
            )}
            {can('sale.read') && (
              <Button variant="secondary" onClick={() => go('sales')}>
                {t('pages.sales')}
              </Button>
            )}
            {can('product.create') && (
              <Button variant="secondary" onClick={() => go('products')}>
                + {t('pages.products')}
              </Button>
            )}
            {can('expense.create') && (
              <Button variant="secondary" onClick={() => go('expenses')}>
                + {t('pages.expenses')}
              </Button>
            )}
            {can('sheet.manage') && (
              <Button variant="ghost" onClick={() => go('sheets')}>
                {t('pages.sheets')}
              </Button>
            )}
          </div>
          {sheets.data?.connection && (
            <Alert tone={sheets.data.connection.status === 'connected' ? 'success' : 'warning'}>
              Google Sheets: <b>{sheets.data.connection.google_email}</b> ·{' '}
              {sheets.data.connection.status}
            </Alert>
          )}
          {!can('sheet.read') && (
            <p className="muted">Google Sheets status memerlukan izin sheet.read.</p>
          )}
        </Card>
      </div>

      <div className="dash-columns">
        <Card title="Top products">
          {topProducts.length ? (
            <ul className="mini-list">
              {topProducts.map((p) => (
                <li key={p.name}>
                  <b>{p.name}</b>
                  <span>
                    {p.qty}× · {fmtRp(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="◫"
              title={sales.error ? 'Data tidak tersedia' : 'Belum ada produk terjual'}
              description={
                sales.error
                  ? undefined
                  : 'Penjualan akan muncul di sini setelah transaksi POS pertama.'
              }
            />
          )}
        </Card>

        <Card
          title="Recent sales"
          actions={
            can('sale.read') ? (
              <Button variant="ghost" onClick={() => go('sales')}>
                {t('dashboard.viewAll')} →
              </Button>
            ) : undefined
          }
        >
          {sales.data?.length ? (
            <ul className="mini-list">
              {sales.data.slice(0, 8).map((s) => (
                <li key={s.id}>
                  <b>{new Date(s.created_at).toLocaleTimeString('id-ID')}</b>
                  <span>{fmtRp(Number(s.grand_total))}</span>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="◌"
              title="Belum ada penjualan pada rentang ini"
              description="Ubah filter tanggal atau lakukan transaksi di POS."
            />
          )}
        </Card>
      </div>

      <div className="dash-columns">
        <Card title={t('dashboard.salesDistribution')}>
          {statusDistribution.length ? (
            <ul className="dist-list">
              {statusDistribution.map((d) => (
                <li key={d.status}>
                  <StatusBadge status={d.status} />
                  <span className="dist-list__bar" aria-hidden="true">
                    <i style={{ width: `${Math.max(d.share, 4)}%` }} />
                  </span>
                  <b>
                    {d.count} · {d.share}%
                  </b>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="◔"
              title={sales.error ? 'Data tidak tersedia' : 'Belum ada penjualan pada rentang ini'}
            />
          )}
        </Card>

        {can('inventory.read') && (
          <Card
            title={t('dashboard.lowStock')}
            actions={
              <Button variant="ghost" onClick={() => go('inventory')}>
                {t('dashboard.viewAll')} →
              </Button>
            }
          >
            {(lowStock.data?.length ?? 0) > 0 ? (
              <>
                <p className="muted">{t('dashboard.lowStockHint')}</p>
                <ul className="mini-list mini-list--stock">
                  {lowStock.data!.slice(0, 8).map((row: any) => (
                    <li key={row.id}>
                      <b>{row.product?.name ?? row.product_id}</b>
                      <span>{row.branch?.name ?? '—'}</span>
                      <StatusBadge
                        status={Number(row.quantity) <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'}
                      />
                      <em>
                        {row.quantity}/{row.minimum_stock}
                      </em>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <EmptyState
                icon="◫"
                title={
                  lowStock.error ? 'Data tidak tersedia' : t('inventory.stockSafe')
                }
                description={lowStock.error ? undefined : t('dashboard.lowStockHint')}
              />
            )}
          </Card>
        )}
      </div>
    </>
  );
}

export function MiniBars({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="minibars" role="img" aria-label="Sales chart">
      {data.map((d) => (
        <div key={d.label} className="minibars__col" title={`${d.label}: ${d.value}`}>
          <i style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }} />
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Onboarding ---------------- */

export function Onboarding({
  ctx,
  go,
}: {
  ctx: OrgCtx;
  go: (page: string) => void;
}) {
  const { t } = useTranslation();
  const steps = [
    { done: ctx.stores.length > 0, label: t('onboarding.createStore'), page: 'stores' },
    {
      done: ctx.accessible_branches.length > 0,
      label: t('onboarding.createBranch'),
      page: 'branches',
    },
    { done: false, label: t('onboarding.addProduct'), page: 'products' },
    { done: false, label: t('onboarding.openPos'), page: 'pos' },
    { done: false, label: t('onboarding.connectSheets'), page: 'sheets' },
  ];
  return (
    <Card className="onboard">
      <h2>{t('onboarding.title')}</h2>
      <p>{t('onboarding.subtitle')}</p>
      <ol>
        {steps.map((s, i) => (
          <li key={s.label} className={s.done ? 'done' : ''}>
            <button onClick={() => go(s.page)}>
              <b>{i + 1}</b> {s.label} {s.done ? '✓' : '→'}
            </button>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ---------------- Stock transfer ---------------- */

export function TransferForm({
  company,
  token,
  warehouses,
  onDone,
}: {
  company: string;
  token: string;
  warehouses: any[];
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    productId: '',
    quantity: '1',
  });
  const [msg, setMsg] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('...');
    try {
      await api('/inventory/transfer', token, company, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      setMsg(t('messages.saveSuccess'));
      setForm({ fromWarehouseId: '', toWarehouseId: '', productId: '', quantity: '1' });
      onDone();
    } catch (err) {
      setMsg(`${t('messages.saveError')} (${describeError(err)})`);
    }
  };
  return (
    <Card title={t('inventory.transfer')}>
      <form className="inline-form" onSubmit={submit}>
        <Field label="From warehouse">
          <Select
            required
            value={form.fromWarehouseId}
            onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })}
          >
            <option value="">—</option>
            {warehouses.map((w: any) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="To warehouse">
          <Select
            required
            value={form.toWarehouseId}
            onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })}
          >
            <option value="">—</option>
            {warehouses.map((w: any) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Product ID">
          <Input
            required
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
          />
        </Field>
        <Field label={t('common.quantity')}>
          <Input
            type="number"
            min="1"
            required
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
        </Field>
        <Button type="submit">{t('common.submit')}</Button>
        <small>{msg}</small>
      </form>
    </Card>
  );
}

/* ---------------- Settings page ---------------- */

export function SettingsPage({
  ctx,
  companyName,
}: {
  ctx: OrgCtx;
  companyName: string;
}) {
  const { t, language, setLanguage: setLang } = useTranslation();
  const [theme, setThemeState] = useState<Theme>(getTheme());
  return (
    <>
      <Card title={t('settings.profile')}>
        <dl className="def-grid">
          <dt>{t('settings.userId')}</dt>
          <dd>{ctx.user.id}</dd>
          <dt>{t('settings.fullName')}</dt>
          <dd>{ctx.profile?.full_name ?? '—'}</dd>
          <dt>{t('settings.email')}</dt>
          <dd>{ctx.profile?.email ?? '—'}</dd>
        </dl>
      </Card>

      <Card title={t('settings.appearance')}>
        <div className="setting-row">
          <span>{t('settings.themeLight')}</span>
          <ThemeSwitchControl
            label={t('settings.appearance')}
            checked={theme === 'blue'}
            onChange={(on) => {
              const next: Theme = on ? 'blue' : 'light';
              setTheme(next);
              setThemeState(next);
            }}
          />
          <span>{t('settings.themeBlue')}</span>
        </div>
        <div className="setting-row">
          <Tabs2
            options={[
              { id: 'id' as Language, label: t('settings.languageId') },
              { id: 'en' as Language, label: t('settings.languageEn') },
            ]}
            active={language}
            onChange={(l) => {
              setLang(l as Language);
              setLanguage(l as Language);
            }}
          />
        </div>
      </Card>

      <Card title={t('settings.workspace')}>
        <dl className="def-grid">
          <dt>{t('settings.activeCompany')}</dt>
          <dd>{companyName}</dd>
          <dt>{t('settings.yourRole')}</dt>
          <dd>
            {ctx.roles.map((r) => (
              <Badge key={r} tone="info">
                {r}
              </Badge>
            ))}
          </dd>
        </dl>
        <details>
          <summary>
            {t('settings.permissionsGranted')} ({ctx.permissions.length})
          </summary>
          <div className="perm-cloud">
            {ctx.permissions.map((p) => (
              <code key={p}>{p}</code>
            ))}
          </div>
        </details>
      </Card>

      <Card title={t('settings.subscription')}>
        <Alert tone="info">{t('settings.planNotConfigured')}</Alert>
      </Card>

      <Card title={t('settings.dangerZone')}>
        <Button
          variant="danger"
          onClick={() => {
            localStorage.removeItem('niagantara.dashboard.session.v1');
            sessionStorage.clear();
            location.assign('/auth/login');
          }}
        >
          {t('settings.signOutAll')}
        </Button>
      </Card>
    </>
  );
}

function Tabs2({
  options,
  active,
  onChange,
}: {
  options: { id: Language; label: string }[];
  active: Language;
  onChange: (id: string) => void;
}) {
  const { language } = useTranslation();
  void language;
  return (
    <div className="ng-tabs" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={active === o.id}
          className={active === o.id ? 'active' : ''}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Help page ---------------- */

const HELP_KEYS = [
  'dashboard',
  'pos',
  'sales',
  'shifts',
  'products',
  'categories',
  'barcode',
  'inventory',
  'purchases',
  'suppliers',
  'customers',
  'employees',
  'attendance',
  'expenses',
  'payables',
  'receivables',
  'reports',
  'sheets',
  'warehouses',
  'branches',
  'stores',
  'settings',
] as const;

export function HelpPage() {
  const { t } = useTranslation();
  void getLanguage;
  return (
    <Card title={t('help.title')}>
      <p className="muted">{t('help.intro')}</p>
      <div className="help-grid">
        {HELP_KEYS.filter((k) => t(`help.items.${k}`) !== `help.items.${k}`).map((k) => (
          <article key={k}>
            <h3>{t(`pages.${k}`)}</h3>
            <p>{t(`help.items.${k}`)}</p>
          </article>
        ))}
      </div>
      <p>
        <a href="mailto:support@niagantara.com">{t('help.contact')} →</a>
      </p>
    </Card>
  );
}

export { LoadingState, ErrorState };

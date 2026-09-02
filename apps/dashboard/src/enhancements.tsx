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
import {
  getLanguage,
  getTheme,
  setLanguage,
  setTheme,
  useTranslation,
} from '@niagantara/ui';
import {
  Package,
  ReceiptText,
  BarChart3,
  Boxes,
  MonitorSmartphone,
  Clock,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
} from 'lucide-react';

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
  } catch {}
}

export function useResource<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
} {
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

type Sale = {
  id: string;
  status: string;
  grand_total: number;
  refunded_total?: number;
  created_at: string;
  items?: {
    product_id: string;
    product_name: string;
    quantity: number;
    line_total: number;
  }[];
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
  const finance = useResource<any>(
    () => api('/finance/reports', token, company),
    [company, token],
  );
  const sheets = useResource<any>(
    () =>
      can('sheet.read')
        ? api<any>('/google-sheets', token, company)
        : Promise.resolve(null),
    [company, token],
  );
  const products = useResource<any[]>(
    () =>
      can('product.read')
        ? api<any[]>('/products?limit=1', token, company).then(
            (r: any) => r.data ?? r,
          )
        : Promise.resolve([]),
    [company, token],
  );
  const customers = useResource<any[]>(
    () =>
      can('customer.read')
        ? api<any[]>('/customers?limit=1', token, company).then(
            (r: any) => r.data ?? r,
          )
        : Promise.resolve([]),
    [company, token],
  );
  const employees = useResource<any[]>(
    () =>
      can('employee.read')
        ? api<any[]>('/employees?limit=1', token, company).then(
            (r: any) => r.data ?? r,
          )
        : Promise.resolve([]),
    [company, token],
  );

  useEffect(() => {
    const onRealtime = (event: Event) => {
      const resources =
        (event as CustomEvent<{ resources?: string[] }>).detail?.resources ??
        [];
      if (resources.includes('sales')) sales.reload();
      if (resources.includes('inventory')) lowStock.reload();
      if (resources.includes('finance')) finance.reload();
      if (resources.includes('sheets')) sheets.reload();
    };
    window.addEventListener('niagantara:realtime', onRealtime);
    return () => window.removeEventListener('niagantara:realtime', onRealtime);
  }, [sales.reload, lowStock.reload, finance.reload, sheets.reload]);

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
    const map = new Map<
      string,
      { name: string; qty: number; revenue: number }
    >();
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
    for (
      let d = new Date(start);
      d <= end && days.length < 62;
      d.setDate(d.getDate() + 1)
    ) {
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

  const recentActivity = useMemo(() => {
    const items: {
      id: string;
      text: string;
      time: string;
      type: 'sale' | 'alert';
    }[] = [];
    const recentSales = (sales.data ?? []).slice(0, 5);
    for (const s of recentSales) {
      items.push({
        id: `sale-${s.id}`,
        text: `Penjualan ${fmtRp(Number(s.grand_total))} - ${s.status}`,
        time: new Date(s.created_at).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'sale',
      });
    }
    if ((lowStock.data?.length ?? 0) > 0) {
      const first = lowStock.data![0];
      items.push({
        id: `lowstock-${first.id}`,
        text: `Stok rendah: ${first.product?.name ?? 'Produk'} (${first.quantity}/${first.minimum_stock})`,
        time: 'Sekarang',
        type: 'alert',
      });
    }
    return items.slice(0, 5);
  }, [sales.data, lowStock.data]);

  return (
    <>
      <div className="ng-filterbar">
        <Field label={t('common.date')}>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Field label="→">
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
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

      <div
        className="metrics"
        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        <Card title="Total Produk">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background:
                  'color-mix(in srgb, var(--accent-primary, #2563EB) 10%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary, #2563EB)',
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary, #111827)',
                  lineHeight: 1,
                }}
              >
                {products.loading ? '...' : (products.data?.length ?? 0)}
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted, #6B7280)',
                }}
              >
                {products.error ? 'Gagal memuat' : 'produk terdaftar'}
              </div>
            </div>
          </div>
        </Card>
        <Card title="Total Pelanggan">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'color-mix(in srgb, #059669 10%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}
            >
              <ReceiptText size={20} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary, #111827)',
                  lineHeight: 1,
                }}
              >
                {customers.loading ? '...' : (customers.data?.length ?? 0)}
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted, #6B7280)',
                }}
              >
                {customers.error ? 'Gagal memuat' : 'pelanggan terdaftar'}
              </div>
            </div>
          </div>
        </Card>
        <Card title="Staff Aktif">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'color-mix(in srgb, #7C3AED 10%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7C3AED',
              }}
            >
              <BarChart3 size={20} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary, #111827)',
                  lineHeight: 1,
                }}
              >
                {employees.loading ? '...' : (employees.data?.length ?? 0)}
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted, #6B7280)',
                }}
              >
                {employees.error ? 'Gagal memuat' : 'karyawan aktif'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {(can('finance.read') ||
        can('payable.read') ||
        can('receivable.read')) && (
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
              finance.loading ? '' : fmtRp(Number(finance.data?.purchases ?? 0))
            }
            note="period purchases"
            loading={finance.loading}
            error={!!finance.error}
            onRetry={finance.reload}
          />
          <StatCard
            label="Operating cash result"
            value={fmtRp(Number(finance.data?.operatingCashResult ?? 0))}
            tone={
              Number(finance.data?.operatingCashResult ?? 0) >= 0
                ? 'success'
                : 'danger'
            }
            loading={finance.loading}
            error={!!finance.error}
            onRetry={finance.reload}
          />
        </div>
      )}

      <div className="dash-columns">
        <Card
          title={
            <span
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <TrendingUp size={16} /> Revenue Trend
            </span>
          }
        >
          {dailySeries.length > 1 ? (
            <>
              <MiniBars
                data={dailySeries.map((d) => ({
                  label: d.day,
                  value: d.total,
                }))}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted, #6B7280)',
                }}
              >
                <span>{dailySeries.length} hari</span>
                <span>
                  Tertinggi:{' '}
                  {fmtRp(Math.max(...dailySeries.map((d) => d.total)))}
                </span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <TrendingUp
                size={24}
                style={{
                  color: 'var(--text-muted, #94A3B8)',
                  marginBottom: '0.5rem',
                }}
              />
              <p className="muted" style={{ margin: 0 }}>
                Pilih rentang tanggal lebih dari satu hari untuk melihat trend.
              </p>
            </div>
          )}
        </Card>

        <Card title="Aksi Cepat">
          <div className="quick-actions">
            {can('pos.access') && (
              <Button onClick={() => go('pos')}>
                <MonitorSmartphone size={14} /> {t('pages.pos')}
              </Button>
            )}
            {can('sale.read') && (
              <Button variant="secondary" onClick={() => go('sales')}>
                <ReceiptText size={14} /> {t('pages.sales')}
              </Button>
            )}
            {can('product.create') && (
              <Button variant="secondary" onClick={() => go('products')}>
                <Package size={14} /> {t('pages.products')}
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
            <Alert
              tone={
                sheets.data.connection.status === 'connected'
                  ? 'success'
                  : 'warning'
              }
            >
              Google Sheets: <b>{sheets.data.connection.google_email}</b> ·{' '}
              {sheets.data.connection.status}
            </Alert>
          )}
          {!can('sheet.read') && (
            <p className="muted" style={{ fontSize: '0.82rem' }}>
              Google Sheets status memerlukan izin sheet.read.
            </p>
          )}
        </Card>
      </div>

      <div className="dash-columns">
        <Card title="Aktivitas Terkini">
          {recentActivity.length ? (
            <ul className="mini-list">
              {recentActivity.map((item) => (
                <li key={item.id} style={{ gap: '0.6rem' }}>
                  {item.type === 'sale' ? (
                    <ReceiptText
                      size={14}
                      style={{
                        color: 'var(--accent-primary, #2563EB)',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <AlertTriangle
                      size={14}
                      style={{
                        color: 'var(--warning, #F59E0B)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <b
                    style={{
                      fontSize: '0.85rem',
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.text}
                  </b>
                  <em
                    style={{
                      fontStyle: 'normal',
                      marginLeft: 'auto',
                      color: 'var(--text-muted, #6B7280)',
                      fontSize: '0.78rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.time}
                  </em>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <Clock
                size={24}
                style={{
                  color: 'var(--text-muted, #94A3B8)',
                  marginBottom: '0.5rem',
                }}
              />
              <p className="muted" style={{ margin: 0 }}>
                Belum ada aktivitas terkini pada periode ini.
              </p>
            </div>
          )}
        </Card>

        <Card title="Top Produk">
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
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <Package
                size={24}
                style={{
                  color: 'var(--text-muted, #94A3B8)',
                  marginBottom: '0.5rem',
                }}
              />
              <p className="muted" style={{ margin: '0 0 0.5rem' }}>
                {sales.error
                  ? 'Data tidak tersedia'
                  : 'Belum ada produk terjual pada periode ini'}
              </p>
              {!sales.error && (
                <span
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-muted, #94A3B8)',
                  }}
                >
                  Penjualan akan muncul di sini setelah transaksi POS pertama.
                </span>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="dash-columns">
        <Card
          title="Penjualan Terakhir"
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
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <ReceiptText
                size={24}
                style={{
                  color: 'var(--text-muted, #94A3B8)',
                  marginBottom: '0.5rem',
                }}
              />
              <p className="muted" style={{ margin: '0 0 0.5rem' }}>
                Belum ada penjualan pada rentang ini
              </p>
              <span
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted, #94A3B8)',
                }}
              >
                Ubah filter tanggal atau lakukan transaksi di POS.
              </span>
            </div>
          )}
        </Card>

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
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <BarChart3
                size={24}
                style={{
                  color: 'var(--text-muted, #94A3B8)',
                  marginBottom: '0.5rem',
                }}
              />
              <p className="muted" style={{ margin: 0 }}>
                {sales.error
                  ? 'Data tidak tersedia'
                  : 'Belum ada data distribusi penjualan'}
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="dash-columns">
        <Card
          title={
            <span
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <AlertTriangle size={16} /> Stok Rendah
            </span>
          }
          actions={
            can('inventory.read') ? (
              <Button variant="ghost" onClick={() => go('inventory')}>
                {t('dashboard.viewAll')} →
              </Button>
            ) : undefined
          }
        >
          {(lowStock.data?.length ?? 0) > 0 ? (
            <>
              <p
                className="muted"
                style={{ fontSize: '0.82rem', marginBottom: '0.5rem' }}
              >
                {t('dashboard.lowStockHint')}
              </p>
              <ul className="mini-list mini-list--stock">
                {lowStock.data!.slice(0, 8).map((row: any) => (
                  <li key={row.id}>
                    <b>{row.product?.name ?? row.product_id}</b>
                    <span>{row.branch?.name ?? '—'}</span>
                    <StatusBadge
                      status={
                        Number(row.quantity) <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
                      }
                    />
                    <em>
                      {row.quantity}/{row.minimum_stock}
                    </em>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <Boxes
                size={24}
                style={{
                  color: 'var(--text-muted, #94A3B8)',
                  marginBottom: '0.5rem',
                }}
              />
              <p className="muted" style={{ margin: '0 0 0.5rem' }}>
                {lowStock.error
                  ? 'Data tidak tersedia'
                  : t('inventory.stockSafe')}
              </p>
              <span
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted, #94A3B8)',
                }}
              >
                {lowStock.error ? undefined : t('dashboard.lowStockHint')}
              </span>
            </div>
          )}
        </Card>

        <Card
          title={
            <span
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CalendarDays size={16} /> Shift Mendatang
            </span>
          }
        >
          {(() => {
            const now = new Date();
            const todayStr = isoDay(now);
            const todaySales = (sales.data ?? []).filter(
              (s) => s.created_at.slice(0, 10) === todayStr,
            );
            if (todaySales.length > 0) {
              const total = fmtRp(
                todaySales.reduce((n, s) => n + Number(s.grand_total), 0),
              );
              return (
                <div style={{ padding: '0.5rem 0' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0',
                      borderBottom: '1px solid var(--border-color, #E5E7EB)',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background:
                          'color-mix(in srgb, var(--accent-primary, #2563EB) 10%, transparent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-primary, #2563EB)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      {ctx.accessible_branches.length > 0
                        ? (ctx.accessible_branches[0].name?.[0] ?? '?')
                        : '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--text-primary, #111827)',
                        }}
                      >
                        {branch?.name ??
                          ctx.accessible_branches[0]?.name ??
                          'Semua Cabang'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted, #6B7280)',
                        }}
                      >
                        {todaySales.length} transaksi hari ini
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--text-primary, #111827)',
                      }}
                    >
                      {total}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '0.75rem',
                      fontSize: '0.78rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted, #6B7280)' }}>
                      Rata-rata per transaksi
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'var(--text-primary, #111827)',
                      }}
                    >
                      {fmtRp(
                        todaySales.length
                          ? Number(
                              todaySales.reduce(
                                (n, s) => n + Number(s.grand_total),
                                0,
                              ),
                            ) / todaySales.length
                          : 0,
                      )}
                    </span>
                  </div>
                </div>
              );
            }
            return (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CalendarDays
                  size={24}
                  style={{
                    color: 'var(--text-muted, #94A3B8)',
                    marginBottom: '0.5rem',
                  }}
                />
                <p className="muted" style={{ margin: '0 0 0.5rem' }}>
                  Belum ada shift aktif hari ini
                </p>
                <span
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-muted, #94A3B8)',
                  }}
                >
                  Mulai shift dari halaman POS untuk memulai pencatatan.
                </span>
              </div>
            );
          })()}
        </Card>
      </div>
    </>
  );
}

export function CommandCenter({
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
  const lowStock = useResource<any[]>(
    () => api<any[]>('/inventory/low-stock', token, company),
    [company, token],
  );
  const shifts = useResource<any[]>(
    () => api<any[]>('/shifts', token, company),
    [company, token],
  );
  const sheets = useResource<any>(
    () =>
      ctx.permissions.includes('sheet.read')
        ? api('/google-sheets', token, company)
        : Promise.resolve(null),
    [company, token, ctx.permissions],
  );
  const activeShifts = (shifts.data ?? []).filter(
    (item) => item.status === 'OPEN' || item.status === 'ACTIVE',
  );
  const hasError = lowStock.error || shifts.error || sheets.error;
  const retry = () => {
    lowStock.reload();
    shifts.reload();
    sheets.reload();
  };
  const status = lowStock.data?.length ? 'WARNING' : 'HEALTHY';
  return (
    <div className="command-center">
      <div className="ng-filterbar">
        <Badge tone="info">
          {t('context.branch')}: {branch?.name ?? t('context.allBranches')}
        </Badge>
        <span className="muted">
          Status operasional berbasis data yang tersedia
        </span>
      </div>
      {hasError && (
        <ErrorState
          message="Sebagian data operasional tidak dapat dimuat."
          onRetry={retry}
          retryLabel="Coba lagi"
        />
      )}
      <div className="metrics command-center__summary">
        <StatCard
          label="Cabang Aktif"
          value={String(ctx.accessible_branches.length)}
          loading={false}
        />
        <StatCard
          label="Shift Aktif"
          value={String(activeShifts.length)}
          loading={shifts.loading}
          error={!!shifts.error}
          onRetry={shifts.reload}
        />
        <StatCard
          label="Stok Kritis"
          value={String(lowStock.data?.length ?? 0)}
          tone={lowStock.data?.length ? 'warning' : 'default'}
          loading={lowStock.loading}
          error={!!lowStock.error}
          onRetry={lowStock.reload}
        />
        <StatCard
          label="Integrasi Sheets"
          value={
            sheets.loading
              ? '...'
              : (sheets.data?.connection?.status ?? 'Belum terhubung')
          }
          loading={false}
        />
      </div>
      <div className="dash-columns">
        <Card title="Kesehatan Cabang">
          <ul className="mini-list">
            {ctx.accessible_branches.length ? (
              ctx.accessible_branches.map((item: any) => (
                <li key={item.id}>
                  <b>{item.name}</b>
                  <StatusBadge status={status} />
                  <span>
                    {status === 'WARNING'
                      ? 'Ada stok rendah'
                      : 'Tidak ada peringatan'}
                  </span>
                </li>
              ))
            ) : (
              <EmptyState
                title="Belum ada cabang"
                description="Tambahkan cabang untuk melihat status operasional."
              />
            )}
          </ul>
        </Card>
        <Card title="Shift Berjalan">
          {activeShifts.length ? (
            <ul className="mini-list">
              {activeShifts.slice(0, 6).map((item: any) => (
                <li key={item.id}>
                  <b>{item.cashier?.name ?? item.cashier_id ?? 'Kasir'}</b>
                  <span>
                    {item.opened_at
                      ? new Date(item.opened_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Waktu tidak tersedia'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Tidak ada shift aktif"
              description="Shift aktif akan tampil ketika kasir membuka shift."
            />
          )}
        </Card>
      </div>
      <Card title="Peringatan Operasional">
        {lowStock.data?.length ? (
          <ul className="mini-list">
            {lowStock.data.slice(0, 8).map((item: any) => (
              <li key={item.id}>
                <AlertTriangle size={15} aria-hidden="true" />
                <b>{item.product?.name ?? 'Produk'}</b>
                <span>
                  {item.quantity} / minimum {item.minimum_stock}
                </span>
                <Button variant="ghost" onClick={() => go('inventory')}>
                  Lihat stok
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Tidak ada peringatan"
            description="Belum ada stok di bawah batas minimum."
          />
        )}
      </Card>
    </div>
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
        <div
          key={d.label}
          className="minibars__col"
          title={`${d.label}: ${d.value}`}
        >
          <i style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }} />
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Onboarding({
  ctx,
  go,
}: {
  ctx: OrgCtx;
  go: (page: string) => void;
}) {
  const { t } = useTranslation();
  const steps = [
    {
      done: ctx.stores.length > 0,
      label: t('onboarding.createStore'),
      page: 'stores',
    },
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
      setForm({
        fromWarehouseId: '',
        toWarehouseId: '',
        productId: '',
        quantity: '1',
      });
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
            onChange={(e) =>
              setForm({ ...form, fromWarehouseId: e.target.value })
            }
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
            onChange={(e) =>
              setForm({ ...form, toWarehouseId: e.target.value })
            }
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
        {HELP_KEYS.filter(
          (k) => t(`help.items.${k}`) !== `help.items.${k}`,
        ).map((k) => (
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

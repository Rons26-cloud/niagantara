import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  Pagination,
  Select,
  StatCard,
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import {
  Clock,
  CreditCard,
  Download,
  ReceiptText,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { Receipt } from '@niagantara/pos-core';

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

type Sale = {
  id: string;
  transaction_number: string;
  status: string;
  grand_total: number;
  refunded_total?: number;
  created_at: string;
  cashier_id?: string;
  branch_id?: string;
  shift_id?: string;
  payments?: { method: string; amount: number }[];
  items?: any[];
};

export function SalesPage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Sale[]>([]);
  const [sale, setSale] = useState<any>();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [branch, setBranch] = useState('');
  const [cashier, setCashier] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api<Sale[]>(
      `/sales?search=${encodeURIComponent(q)}&status=${status}&paymentMethod=${payment}&branchId=${branch}&cashierId=${cashier}&from=${from}&to=${to}`,
      token,
      company,
    )
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  useEffect(() => {
    const onRealtime = (event: Event) => {
      const resources =
        (event as CustomEvent<{ resources?: string[] }>).detail?.resources ??
        [];
      if (resources.includes('sales')) load();
    };
    window.addEventListener('niagantara:realtime', onRealtime);
    return () => window.removeEventListener('niagantara:realtime', onRealtime);
  }, [company, token]);

  const detail = async (id: string) => {
    try {
      setSale(await api(`/sales/${id}`, token, company));
    } catch {}
  };

  const fmtRp = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

  const paidSales = useMemo(
    () =>
      rows.filter((s) =>
        ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(s.status),
      ),
    [rows],
  );
  const revenue = useMemo(
    () =>
      paidSales.reduce(
        (sum, s) => sum + Number(s.grand_total) - Number(s.refunded_total ?? 0),
        0,
      ),
    [paidSales],
  );
  const avgTransaction = paidSales.length ? revenue / paidSales.length : 0;
  const cancelledCount = rows.filter((s) => s.status === 'CANCELLED').length;
  const refundCount = rows.filter((s) =>
    ['REFUNDED', 'PARTIALLY_REFUNDED'].includes(s.status),
  ).length;
  const refundRate =
    paidSales.length > 0
      ? Math.round((refundCount / paidSales.length) * 100)
      : 0;

  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const s of paidSales) {
      const method = s.payments?.[0]?.method ?? 'UNKNOWN';
      const cur = map.get(method) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(s.grand_total);
      map.set(method, cur);
    }
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [paidSales]);

  const hourlyDistribution = useMemo(() => {
    const hours = new Array(24).fill(0);
    for (const s of paidSales) {
      const h = new Date(s.created_at).getHours();
      hours[h] += Number(s.grand_total);
    }
    return hours.map((total, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      total,
    }));
  }, [paidSales]);

  const { page, pageCount, setPage, slice } = usePaged(rows);

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="metrics">
        <StatCard
          label="Total Pendapatan"
          value={fmtRp(revenue)}
          tone="success"
        />
        <StatCard label="Total Transaksi" value={String(paidSales.length)} />
        <StatCard label="Rata-rata Transaksi" value={fmtRp(avgTransaction)} />
        <StatCard
          label="Refund Rate"
          value={`${refundRate}%`}
          tone={refundRate > 5 ? 'danger' : 'default'}
        />
      </div>

      {paymentBreakdown.length > 0 && (
        <div className="metrics">
          {paymentBreakdown.slice(0, 4).map(([method, { count, total }]) => (
            <StatCard
              key={method}
              label={method.replace(/_/g, ' ')}
              value={`${count} transaksi`}
              note={fmtRp(total)}
            />
          ))}
        </div>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.sales')}</h2>
        </div>

        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nomor transaksi..."
          />
          <Button type="submit">{t('common.search')}</Button>
        </form>

        <div className="ng-filterbar" style={{ marginTop: 12 }}>
          <Field label="Dari">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="Sampai">
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
          {ctx.accessible_branches.length > 1 && (
            <Field label="Cabang">
              <Select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option value="">Semua</option>
                {ctx.accessible_branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Metode Bayar">
            <Select
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
            >
              <option value="">Semua</option>
              {['CASH', 'QRIS', 'BANK_TRANSFER', 'E_WALLET', 'OTHER'].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua</option>
              {['PAID', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'].map(
                (x) => (
                  <option key={x}>{x}</option>
                ),
              )}
            </Select>
          </Field>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<ReceiptText size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada penjualan. Transaksi akan muncul di sini."
          />
        ) : (
          <div className="sale-list">
            {slice.map((x: any) => (
              <button
                key={x.id}
                onClick={() => detail(x.id)}
                className="sale-item"
              >
                <div className="sale-item-left">
                  <span className="sale-item-number">
                    {x.transaction_number}
                  </span>
                  <span className="sale-item-time">
                    <Clock size={12} />
                    {new Date(x.created_at).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="sale-item-right">
                  <span className="sale-item-total">
                    {fmtRp(Number(x.grand_total))}
                  </span>
                  <StatusBadge status={x.status} />
                </div>
              </button>
            ))}
          </div>
        )}

        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </section>

      {hourlyDistribution.some((h) => h.total > 0) && (
        <section className="panel">
          <div className="panel-head">
            <h2>Distribusi Penjualan per Jam</h2>
          </div>
          <div className="hourly-chart">
            {hourlyDistribution
              .filter((h) => h.total > 0)
              .map((h) => {
                const maxVal = Math.max(
                  ...hourlyDistribution.map((x) => x.total),
                  1,
                );
                return (
                  <div key={h.hour} className="hourly-bar">
                    <div
                      className="hourly-bar-fill"
                      style={{ height: `${(h.total / maxVal) * 100}%` }}
                    />
                    <span className="hourly-bar-label">{h.hour}</span>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {sale && (
        <section className="panel">
          <div className="panel-head">
            <h2>Detail Transaksi</h2>
            <Button variant="ghost" onClick={() => setSale(undefined)}>
              <X size={14} /> Tutup
            </Button>
          </div>
          <Receipt sale={sale} onClose={() => setSale(undefined)} />
          {ctx.permissions.includes('sale.cancel') &&
            sale.status === 'PAID' && (
              <Button
                variant="danger"
                style={{ marginTop: '1rem' }}
                onClick={async () => {
                  const reason = prompt('Alasan pembatalan');
                  if (reason) {
                    await api(`/sales/${sale.id}/cancel`, token, company, {
                      method: 'POST',
                      body: JSON.stringify({ reason }),
                    });
                    setSale(undefined);
                    load();
                  }
                }}
              >
                {t('common.cancel')} Transaksi
              </Button>
            )}
        </section>
      )}
    </>
  );
}

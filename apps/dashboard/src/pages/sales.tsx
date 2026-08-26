import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Pagination,
  Select,
  StatCard,
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import { ReceiptText } from 'lucide-react';
import { Receipt } from '@niagantara/pos-core';

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
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
  const [rows, setRows] = useState<any[]>([]);
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

  const load = () => {
    setLoading(true);
    setError(null);
    api<any[]>(
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

  const detail = async (id: string) =>
    setSale(await api(`/sales/${id}`, token, company));

  const fmtRp = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

  const paidSales = rows.filter((s) =>
    ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(s.status),
  );
  const revenue = paidSales.reduce(
    (sum, s) => sum + Number(s.grand_total) - Number(s.refunded_total ?? 0),
    0,
  );
  const avgTransaction = paidSales.length ? revenue / paidSales.length : 0;

  const { page, pageCount, setPage, slice } = usePaged(rows);

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="metrics">
        <StatCard label="Total Pendapatan" value={fmtRp(revenue)} />
        <StatCard label="Total Transaksi" value={String(paidSales.length)} />
        <StatCard label="Rata-rata Transaksi" value={fmtRp(avgTransaction)} />
        <StatCard label="Total Item" value={String(rows.length)} note="semua status" />
      </div>

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
            placeholder="Nomor transaksi"
          />
          <Button type="submit">{t('common.search')}</Button>
        </form>

        <div className="ng-filterbar" style={{ marginTop: 12 }}>
          <Field label="Dari">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Sampai">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Branch ID">
            <Input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Branch ID"
            />
          </Field>
          <Field label="Cashier ID">
            <Input
              value={cashier}
              onChange={(e) => setCashier(e.target.value)}
              placeholder="Cashier ID"
            />
          </Field>
          <Field label={t('demo.paymentMethod')}>
            <Select value={payment} onChange={(e) => setPayment(e.target.value)}>
              <option value="">{t('demo.allPayments')}</option>
              {['CASH', 'QRIS', 'BANK_TRANSFER', 'E_WALLET', 'OTHER'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('common.status')}>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua</option>
              {['PAID', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'].map((x) => (
                <option key={x}>{x}</option>
              ))}
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
              <button key={x.id} onClick={() => detail(x.id)}>
                <b>{x.transaction_number}</b>
                <span>{new Date(x.created_at).toLocaleString('id-ID')}</span>
                <strong>{fmtRp(Number(x.grand_total))}</strong>
                <small>
                  <StatusBadge status={x.status} />
                </small>
              </button>
            ))}
          </div>
        )}

        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </section>

      {sale && (
        <section className="panel">
          <Receipt sale={sale} onClose={() => setSale(undefined)} />
          {ctx.permissions.includes('sale.cancel') && sale.status === 'PAID' && (
            <Button
              variant="danger"
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
              {t('common.cancel')} {t('common.sale')}
            </Button>
          )}
        </section>
      )}
    </>
  );
}

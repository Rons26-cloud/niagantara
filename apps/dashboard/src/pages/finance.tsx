import { useEffect, useState } from 'react';
import { ApiError, api } from '../api';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  StatCard,
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import { HandCoins, BadgeDollarSign, BarChart3 } from 'lucide-react';

type Ctx = {
  permissions: string[];
};

type FinanceView = 'payables' | 'receivables' | 'reports';

function fmtRp(n: number) {
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

export function FinancePage({
  view,
  company,
  token,
  ctx,
}: {
  view: FinanceView;
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const path = view === 'reports' ? '/finance/reports' : '/finance/' + view;

  const load = () => {
    setLoading(true);
    setError(null);
    api(path, token, company)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [path, company, token]);

  async function pay(row: any) {
    const amount = prompt('Jumlah pembayaran', String(row.remaining_amount));
    if (amount) {
      try {
        await api('/finance/' + view + '/' + row.id + '/payments', token, company, {
          method: 'POST',
          body: JSON.stringify({
            amount: Number(amount),
            paymentMethod: 'BANK_TRANSFER',
            idempotencyKey: crypto.randomUUID(),
          }),
        });
        setMsg(t('messages.saveSuccess'));
        load();
      } catch {
        setMsg(t('messages.saveError'));
      }
    }
  }

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  if (view === 'reports') {
    return (
      <>
        <div className="metrics">
          <StatCard
            label="Pendapatan"
            value={fmtRp(Number(data?.revenue ?? 0))}
          />
          <StatCard
            label="Pengeluaran"
            value={fmtRp(Number(data?.expenses ?? 0))}
          />
          <StatCard
            label="Pembelian"
            value={fmtRp(Number(data?.purchases ?? 0))}
          />
          <StatCard
            label="Refund"
            value={fmtRp(Number(data?.refunds ?? 0))}
          />
        </div>
        <section className="panel">
          <h2>{t('pages.reports')}</h2>
          {!data ? (
            <EmptyState
              icon={<BarChart3 size={28} />}
              title={t('dashboard.noData')}
            />
          ) : (
            <>
              <div className="metrics">
                {[
                  ['revenue', 'Pendapatan'],
                  ['cashReceived', 'Kas Diterima'],
                  ['expenses', 'Pengeluaran'],
                  ['purchases', 'Pembelian'],
                  ['refunds', 'Refund'],
                  ['operatingCashResult', 'Hasil Operasional Kas'],
                ].map(([k, label]) => (
                  <StatCard
                    key={k}
                    label={label}
                    value={fmtRp(Number((data as any)[k] ?? 0))}
                    tone={
                      k === 'operatingCashResult'
                        ? Number((data as any)[k] ?? 0) >= 0
                          ? 'success'
                          : 'danger'
                        : 'default'
                    }
                  />
                ))}
              </div>
              {data.label && <p className="muted">{data.label}</p>}
            </>
          )}
          {msg && <p className="muted">{msg}</p>}
        </section>
      </>
    );
  }

  const items: any[] = Array.isArray(data) ? data : [];
  const permission = view === 'payables' ? 'payable.manage' : 'receivable.manage';
  const icon = view === 'payables' ? <HandCoins size={28} /> : <BadgeDollarSign size={28} />;
  const { page, pageCount, setPage, slice } = usePaged(items);

  return (
    <>
      <section className="panel">
        <h2>{view === 'payables' ? t('pages.payables') : t('pages.receivables')}</h2>
        {items.length === 0 ? (
          <EmptyState
            icon={icon}
            title={t('dashboard.noData')}
            description={
              view === 'payables'
                ? 'Belum ada hutang yang tercatat.'
                : 'Belum ada piutang yang tercatat.'
            }
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {['Deskripsi', 'Jumlah', 'Sisa', 'Status', 'Jatuh Tempo'].map(
                (k) => (
                  <span key={k}>{k}</span>
                ),
              )}
            </div>
            {slice.map((r: any) => (
              <button
                className="tr"
                key={r.id}
                onClick={() => ctx.permissions.includes(permission) && pay(r)}
                style={{ cursor: ctx.permissions.includes(permission) ? 'pointer' : 'default' }}
              >
                <span>
                  {r.description ?? r.purchase?.purchase_number ?? r.sale?.transaction_number ?? r.id}
                </span>
                <span>{fmtRp(Number(r.amount ?? 0))}</span>
                <span>{fmtRp(Number(r.remaining_amount ?? 0))}</span>
                <span>
                  <StatusBadge status={r.status ?? 'PENDING'} />
                </span>
                <span>{r.due_date ?? '—'}</span>
              </button>
            ))}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        {msg && <p className="muted">{msg}</p>}
      </section>
    </>
  );
}

import { useEffect, useState } from 'react';
import { ApiError, api } from '../api';
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
  BadgeDollarSign,
  BarChart3,
  Download,
  FileText,
  HandCoins,
  PieChart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

type Ctx = {
  permissions: string[];
};

type FinanceView = 'payables' | 'receivables' | 'reports';

function fmtRp(n: number) {
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

type ReportTab =
  | 'overview'
  | 'profit-loss'
  | 'cashflow'
  | 'payables'
  | 'receivables'
  | 'analysis';

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
  const [reportTab, setReportTab] = useState<ReportTab>(
    view === 'payables'
      ? 'payables'
      : view === 'receivables'
        ? 'receivables'
        : 'overview',
  );
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (view === 'payables') setReportTab('payables');
    else if (view === 'receivables') setReportTab('receivables');
    else setReportTab('overview');
  }, [view]);

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Ringkasan', icon: <BarChart3 size={14} /> },
    { id: 'profit-loss', label: 'Laba Rugi', icon: <TrendingUp size={14} /> },
    { id: 'cashflow', label: 'Arus Kas', icon: <Wallet size={14} /> },
    { id: 'payables', label: 'Hutang', icon: <HandCoins size={14} /> },
    {
      id: 'receivables',
      label: 'Piutang',
      icon: <BadgeDollarSign size={14} />,
    },
    { id: 'analysis', label: 'Analisis', icon: <PieChart size={14} /> },
  ];

  return (
    <>
      <div className="ng-filterbar">
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
      </div>

      <div className="finance-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={reportTab === tab.id ? 'active' : ''}
            onClick={() => setReportTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {reportTab === 'overview' && (
        <OverviewTab company={company} token={token} from={from} to={to} />
      )}
      {reportTab === 'profit-loss' && (
        <ProfitLossTab company={company} token={token} from={from} to={to} />
      )}
      {reportTab === 'cashflow' && (
        <CashflowTab company={company} token={token} from={from} to={to} />
      )}
      {reportTab === 'payables' && (
        <PayablesTab company={company} token={token} ctx={ctx} />
      )}
      {reportTab === 'receivables' && (
        <ReceivablesTab company={company} token={token} ctx={ctx} />
      )}
      {reportTab === 'analysis' && (
        <AnalysisTab company={company} token={token} from={from} to={to} />
      )}
    </>
  );
}

function OverviewTab({
  company,
  token,
  from,
  to,
}: {
  company: string;
  token: string;
  from: string;
  to: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api(`/finance/reports?from=${from}&to=${to}`, token, company)
      .then(setData)
      .catch((e) =>
        setError(
          e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error',
        ),
      )
      .finally(() => setLoading(false));
  }, [company, token, from, to]);

  if (loading) return <LoadingState label="Memuat laporan..." />;
  if (error) return <ErrorState message={error} />;

  const revenue = Number(data?.revenue ?? 0);
  const expenses = Number(data?.expenses ?? 0);
  const purchases = Number(data?.purchases ?? 0);
  const refunds = Number(data?.refunds ?? 0);
  const cashReceived = Number(data?.cashReceived ?? 0);
  const netProfit = Number(data?.operatingCashResult ?? 0);

  return (
    <>
      <div className="metrics">
        <StatCard
          label="Total Pendapatan"
          value={fmtRp(revenue)}
          tone="success"
        />
        <StatCard
          label="Total Pengeluaran"
          value={fmtRp(expenses)}
          tone="danger"
        />
        <StatCard
          label="Total Pembelian"
          value={fmtRp(purchases)}
          tone="warning"
        />
        <StatCard
          label="Total Refund"
          value={fmtRp(refunds)}
          tone={refunds > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="metrics">
        <StatCard
          label="Kas Diterima"
          value={fmtRp(cashReceived)}
          tone="success"
        />
        <StatCard
          label="Laba Bersih Operasional"
          value={fmtRp(netProfit)}
          tone={netProfit >= 0 ? 'success' : 'danger'}
        />
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Rincian Pendapatan</h2>
        </div>
        <div className="finance-detail-grid">
          <div className="finance-detail-item">
            <span className="finance-detail-label">
              Pendapatan Bersih (after refund)
            </span>
            <span className="finance-detail-value">
              {fmtRp(revenue - refunds)}
            </span>
          </div>
          <div className="finance-detail-item">
            <span className="finance-detail-label">
              Persentase Pengeluaran terhadap Pendapatan
            </span>
            <span className="finance-detail-value">
              {revenue > 0 ? Math.round((expenses / revenue) * 100) : 0}%
            </span>
          </div>
          <div className="finance-detail-item">
            <span className="finance-detail-label">Margin Laba Bersih</span>
            <span className="finance-detail-value finance-detail-value--bold">
              {revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0}%
            </span>
          </div>
          <div className="finance-detail-item">
            <span className="finance-detail-label">Rasio Refund</span>
            <span className="finance-detail-value">
              {revenue > 0 ? Math.round((refunds / revenue) * 100) : 0}%
            </span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Visualisasi Komposisi</h2>
        </div>
        <MiniBarChart
          data={[
            { label: 'Pendapatan', value: revenue, color: '#10b981' },
            { label: 'Pengeluaran', value: expenses, color: '#ef4444' },
            { label: 'Pembelian', value: purchases, color: '#f59e0b' },
            { label: 'Refund', value: refunds, color: '#8b5cf6' },
          ]}
        />
      </section>

      {data?.label && <p className="muted">{data.label}</p>}
    </>
  );
}

function ProfitLossTab({
  company,
  token,
  from,
  to,
}: {
  company: string;
  token: string;
  from: string;
  to: string;
}) {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api<any[]>(`/sales?from=${from}&to=${to}`, token, company).catch(
        () => [],
      ),
      api<any[]>(`/expenses?from=${from}&to=${to}`, token, company).catch(
        () => [],
      ),
    ])
      .then(([sales, expenses]) => {
        setSalesData(sales);
        setExpenseData(expenses);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [company, token, from, to]);

  if (loading) return <LoadingState label="Memuat laba rugi..." />;

  const totalRevenue = salesData
    .filter((s: any) => ['PAID', 'PARTIALLY_REFUNDED'].includes(s.status))
    .reduce(
      (n: number, s: any) =>
        n + Number(s.grand_total) - Number(s.refunded_total ?? 0),
      0,
    );
  const totalRefunds = salesData
    .filter((s: any) => ['REFUNDED', 'PARTIALLY_REFUNDED'].includes(s.status))
    .reduce((n: number, s: any) => n + Number(s.refunded_total ?? 0), 0);
  const totalExpenses = expenseData.reduce(
    (n: number, e: any) => n + Number(e.amount ?? 0),
    0,
  );
  const netIncome = totalRevenue - totalExpenses;

  const expenseByCategory = new Map<string, number>();
  for (const e of expenseData) {
    const cat = e.category?.name ?? 'Lainnya';
    expenseByCategory.set(
      cat,
      (expenseByCategory.get(cat) ?? 0) + Number(e.amount ?? 0),
    );
  }

  return (
    <>
      <div className="metrics">
        <StatCard
          label="Pendapatan"
          value={fmtRp(totalRevenue)}
          tone="success"
        />
        <StatCard label="Refund" value={fmtRp(totalRefunds)} tone="danger" />
        <StatCard
          label="Pengeluaran"
          value={fmtRp(totalExpenses)}
          tone="danger"
        />
        <StatCard
          label="Laba Bersih"
          value={fmtRp(netIncome)}
          tone={netIncome >= 0 ? 'success' : 'danger'}
        />
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Laporan Laba Rugi</h2>
        </div>
        <div className="pl-report">
          <div className="pl-section">
            <h3>Pendapatan</h3>
            <div className="pl-row pl-row--total">
              <span>Total Pendapatan Bersih</span>
              <span className="pl-amount pl-amount--positive">
                {fmtRp(totalRevenue)}
              </span>
            </div>
            <div className="pl-row pl-row--deduction">
              <span>Refund</span>
              <span className="pl-amount pl-amount--negative">
                ({fmtRp(totalRefunds)})
              </span>
            </div>
          </div>

          <div className="pl-section">
            <h3>Pengeluaran</h3>
            {[...expenseByCategory.entries()].map(([cat, amount]) => (
              <div className="pl-row" key={cat}>
                <span>{cat}</span>
                <span className="pl-amount pl-amount--negative">
                  {fmtRp(amount)}
                </span>
              </div>
            ))}
            <div className="pl-row pl-row--total">
              <span>Total Pengeluaran</span>
              <span className="pl-amount pl-amount--negative">
                ({fmtRp(totalExpenses)})
              </span>
            </div>
          </div>

          <div className="pl-section pl-section--net">
            <div className="pl-row pl-row--net">
              <span>Laba / Rugi Bersih</span>
              <span
                className={`pl-amount ${netIncome >= 0 ? 'pl-amount--positive' : 'pl-amount--negative'}`}
              >
                {fmtRp(netIncome)}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function CashflowTab({
  company,
  token,
  from,
  to,
}: {
  company: string;
  token: string;
  from: string;
  to: string;
}) {
  const [data, setData] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api(`/finance/reports?from=${from}&to=${to}`, token, company).catch(
        () => null,
      ),
      api<any[]>(`/sales?from=${from}&to=${to}`, token, company).catch(
        () => [],
      ),
    ])
      .then(([report, salesData]) => {
        setData(report);
        setSales(salesData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [company, token, from, to]);

  if (loading) return <LoadingState label="Memuat arus kas..." />;

  const paidSales = sales.filter((s: any) =>
    ['PAID', 'PARTIALLY_REFUNDED'].includes(s.status),
  );

  const cashInflow = Number(data?.cashReceived ?? 0);
  const cashOutflow =
    Number(data?.expenses ?? 0) + Number(data?.purchases ?? 0);
  const netCashflow = cashInflow - cashOutflow;

  const paymentMethods = new Map<string, { count: number; total: number }>();
  for (const s of paidSales) {
    const method = s.payments?.[0]?.method ?? 'UNKNOWN';
    const cur = paymentMethods.get(method) ?? { count: 0, total: 0 };
    cur.count += 1;
    cur.total += Number(s.grand_total);
    paymentMethods.set(method, cur);
  }

  return (
    <>
      <div className="metrics">
        <StatCard label="Kas Masuk" value={fmtRp(cashInflow)} tone="success" />
        <StatCard label="Kas Keluar" value={fmtRp(cashOutflow)} tone="danger" />
        <StatCard
          label="Arus Kas Bersih"
          value={fmtRp(netCashflow)}
          tone={netCashflow >= 0 ? 'success' : 'danger'}
        />
        <StatCard label="Jumlah Transaksi" value={String(paidSales.length)} />
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Arus Kas per Metode Pembayaran</h2>
        </div>
        {paymentMethods.size > 0 ? (
          <div className="table">
            <div className="tr head">
              <span>Metode</span>
              <span>Jumlah Transaksi</span>
              <span>Total Nilai</span>
              <span>Persentase</span>
            </div>
            {[...paymentMethods.entries()].map(([method, { count, total }]) => (
              <div className="tr" key={method}>
                <span>
                  <StatusBadge status={method} />
                </span>
                <span>{count}</span>
                <span>{fmtRp(total)}</span>
                <span>
                  {paidSales.length > 0
                    ? Math.round((count / paidSales.length) * 100)
                    : 0}
                  %
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada data transaksi" />
        )}
      </section>
    </>
  );
}

function normalizeList(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    for (const key of [
      'payables',
      'receivables',
      'rows',
      'data',
      'items',
      'results',
    ]) {
      if (Array.isArray(res[key])) return res[key];
    }
  }
  return [];
}

function PayablesTab({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [payRow, setPayRow] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('BANK_TRANSFER');
  const [paying, setPaying] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    api<any[]>('/finance/payables', token, company)
      .then((res) => setData(normalizeList(res)))
      .catch((e) => {
        const msg =
          e instanceof ApiError
            ? e.status === 404
              ? 'Endpoint /finance/payables belum tersedia di server.'
              : `${e.status} · ${e.code}`
            : 'Gagal menghubungi server. Periksa koneksi jaringan.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  async function submitPay() {
    if (!payRow || !payAmount) return;
    setPaying(true);
    try {
      await api(
        '/finance/payables/' + payRow.id + '/payments',
        token,
        company,
        {
          method: 'POST',
          body: JSON.stringify({
            amount: Number(payAmount),
            paymentMethod: payMethod,
            idempotencyKey: crypto.randomUUID(),
          }),
        },
      );
      setMsg('Pembayaran berhasil.');
      setPayRow(null);
      setPayAmount('');
      load();
    } catch {
      setMsg('Gagal melakukan pembayaran. Silakan coba lagi.');
    } finally {
      setPaying(false);
    }
  }

  function handleExport() {
    const header = [
      'Deskripsi',
      'Jumlah',
      'Dibayar',
      'Sisa',
      'Status',
      'Jatuh Tempo',
    ];
    const rows = data.map((r: any) => [
      r.description ?? r.purchase?.purchase_number ?? r.id,
      r.original_amount ?? 0,
      r.paid_amount ?? 0,
      r.remaining_amount ?? 0,
      r.status ?? 'PENDING',
      r.due_date ?? '',
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hutang-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingState label="Memuat hutang..." />;
  if (error) {
    return (
      <section className="panel error">
        <div className="panel-head">
          <h2>Daftar Hutang</h2>
        </div>
        <div className="empty" style={{ padding: '3rem 1.5rem' }}>
          <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
            Gagal memuat data hutang
          </p>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            {error}
          </p>
          <Button onClick={load}>Coba Lagi</Button>
        </div>
      </section>
    );
  }

  const totalOutstanding = data.reduce(
    (n, r) => n + Number(r.remaining_amount ?? 0),
    0,
  );
  const totalPaid = data.reduce((n, r) => n + Number(r.paid_amount ?? 0), 0);
  const pending = data.filter((r) => r.status === 'PENDING').length;
  const overdue = data.filter((r) => r.status === 'OVERDUE').length;

  const { page, pageCount, setPage, slice } = usePaged(data);

  return (
    <>
      <div className="metrics">
        <StatCard
          label="Total Hutang"
          value={fmtRp(totalOutstanding)}
          tone="danger"
        />
        <StatCard
          label="Sudah Dibayar"
          value={fmtRp(totalPaid)}
          tone="success"
        />
        <StatCard label="Menunggu" value={String(pending)} />
        <StatCard
          label="Jatuh Tempo"
          value={String(overdue)}
          tone={overdue > 0 ? 'danger' : 'default'}
        />
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Daftar Hutang</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="ghost"
              onClick={handleExport}
              disabled={data.length === 0}
            >
              <Download size={14} /> Export CSV
            </Button>
          </div>
        </div>
        {data.length === 0 ? (
          <div className="empty" style={{ padding: '3rem 1.5rem' }}>
            <HandCoins
              size={36}
              style={{ opacity: 0.4, marginBottom: '0.75rem' }}
            />
            <p
              style={{
                fontSize: '0.95rem',
                marginBottom: '0.35rem',
                fontWeight: 600,
              }}
            >
              Belum ada data hutang
            </p>
            <p
              className="muted"
              style={{
                fontSize: '0.85rem',
                marginBottom: '1rem',
                maxWidth: 380,
                marginInline: 'auto',
              }}
            >
              Data hutang (payable) akan muncul di sini setelah Anda mencatat
              pembelian dari supplier dengan metode kredit / tempo.
            </p>
            <Button onClick={load}>Muat Ulang</Button>
          </div>
        ) : (
          <div className="table">
            <div className="tr head">
              {[
                'Deskripsi',
                'Jumlah',
                'Dibayar',
                'Sisa',
                'Status',
                'Jatuh Tempo',
                'Aksi',
              ].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {slice.map((r: any) => (
              <div className="tr" key={r.id}>
                <span>
                  {r.description ?? r.purchase?.purchase_number ?? r.id}
                </span>
                <span>{fmtRp(Number(r.original_amount ?? 0))}</span>
                <span>{fmtRp(Number(r.paid_amount ?? 0))}</span>
                <span>
                  <b>{fmtRp(Number(r.remaining_amount ?? 0))}</b>
                </span>
                <span>
                  <StatusBadge status={r.status ?? 'PENDING'} />
                </span>
                <span>{r.due_date ?? '—'}</span>
                <span>
                  {ctx.permissions.includes('payable.manage') &&
                    r.status !== 'PAID' && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setPayRow(r);
                          setPayAmount(String(r.remaining_amount ?? 0));
                        }}
                      >
                        Bayar
                      </Button>
                    )}
                </span>
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        {msg && <p className="muted">{msg}</p>}
      </section>

      <Modal
        open={!!payRow}
        onClose={() => {
          setPayRow(null);
          setPayAmount('');
        }}
        title="Bayar Hutang"
        footer={
          <Button
            onClick={submitPay}
            disabled={!payAmount || Number(payAmount) <= 0 || paying}
          >
            {paying ? 'Memproses...' : 'Konfirmasi Pembayaran'}
          </Button>
        }
      >
        {payRow && (
          <div className="inline-form" style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.35rem',
                }}
              >
                Deskripsi
              </label>
              <span style={{ fontSize: '0.9rem' }}>
                {payRow.description ??
                  payRow.purchase?.purchase_number ??
                  payRow.id}
              </span>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.35rem',
                }}
              >
                Sisa Hutang
              </label>
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                {fmtRp(Number(payRow.remaining_amount ?? 0))}
              </span>
            </div>
            <Field label="Jumlah Pembayaran">
              <Input
                type="number"
                min={1}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Masukkan jumlah"
              />
            </Field>
            <Field label="Metode Pembayaran">
              <Select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
              >
                <option value="BANK_TRANSFER">Transfer Bank</option>
                <option value="CASH">Tunai</option>
                <option value="E_WALLET">E-Wallet</option>
                <option value="OTHER">Lainnya</option>
              </Select>
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}

function ReceivablesTab({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    api<any[]>('/finance/receivables', token, company)
      .then((res) => setData(normalizeList(res)))
      .catch((e) =>
        setError(
          e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error',
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  async function collect(row: any) {
    const amount = prompt('Jumlah penerimaan', String(row.remaining_amount));
    if (amount) {
      try {
        await api(
          '/finance/receivables/' + row.id + '/payments',
          token,
          company,
          {
            method: 'POST',
            body: JSON.stringify({
              amount: Number(amount),
              paymentMethod: 'BANK_TRANSFER',
              idempotencyKey: crypto.randomUUID(),
            }),
          },
        );
        setMsg('Penerimaan berhasil.');
        load();
      } catch {
        setMsg('Gagal mencatat penerimaan.');
      }
    }
  }

  if (loading) return <LoadingState label="Memuat piutang..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const totalOutstanding = data.reduce(
    (n, r) => n + Number(r.remaining_amount ?? 0),
    0,
  );
  const totalCollected = data.reduce(
    (n, r) => n + Number(r.paid_amount ?? 0),
    0,
  );
  const pending = data.filter((r) => r.status === 'PENDING').length;
  const overdue = data.filter((r) => r.status === 'OVERDUE').length;

  const { page, pageCount, setPage, slice } = usePaged(data);

  return (
    <>
      <div className="metrics">
        <StatCard
          label="Total Piutang"
          value={fmtRp(totalOutstanding)}
          tone="warning"
        />
        <StatCard
          label="Sudah Diterima"
          value={fmtRp(totalCollected)}
          tone="success"
        />
        <StatCard label="Menunggu" value={String(pending)} />
        <StatCard
          label="Jatuh Tempo"
          value={String(overdue)}
          tone={overdue > 0 ? 'danger' : 'default'}
        />
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Daftar Piutang</h2>
        </div>
        {data.length === 0 ? (
          <EmptyState
            icon={<BadgeDollarSign size={28} />}
            title="Belum ada piutang"
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {[
                'Deskripsi',
                'Jumlah',
                'Diterima',
                'Sisa',
                'Status',
                'Jatuh Tempo',
                'Aksi',
              ].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {slice.map((r: any) => (
              <div className="tr" key={r.id}>
                <span>
                  {r.description ?? r.sale?.transaction_number ?? r.id}
                </span>
                <span>{fmtRp(Number(r.original_amount ?? 0))}</span>
                <span>{fmtRp(Number(r.paid_amount ?? 0))}</span>
                <span>
                  <b>{fmtRp(Number(r.remaining_amount ?? 0))}</b>
                </span>
                <span>
                  <StatusBadge status={r.status ?? 'PENDING'} />
                </span>
                <span>{r.due_date ?? '—'}</span>
                <span>
                  {ctx.permissions.includes('receivable.manage') &&
                    r.status !== 'PAID' && (
                      <Button variant="ghost" onClick={() => collect(r)}>
                        Terima
                      </Button>
                    )}
                </span>
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        {msg && <p className="muted">{msg}</p>}
      </section>
    </>
  );
}

function AnalysisTab({
  company,
  token,
  from,
  to,
}: {
  company: string;
  token: string;
  from: string;
  to: string;
}) {
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api<any[]>(`/sales?from=${from}&to=${to}`, token, company).catch(
        () => [],
      ),
      api<any[]>(`/expenses?from=${from}&to=${to}`, token, company).catch(
        () => [],
      ),
    ])
      .then(([s, e]) => {
        setSales(normalizeList(s));
        setExpenses(normalizeList(e));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [company, token, from, to]);

  if (loading) return <LoadingState label="Memuat analisis..." />;

  const paidSales = sales.filter((s) =>
    ['PAID', 'PARTIALLY_REFUNDED'].includes(s.status),
  );

  const topProducts = new Map<
    string,
    { name: string; qty: number; revenue: number }
  >();
  for (const s of paidSales) {
    for (const item of s.items ?? []) {
      const cur = topProducts.get(item.product_id) ?? {
        name: item.product_name,
        qty: 0,
        revenue: 0,
      };
      cur.qty += Number(item.quantity);
      cur.revenue += Number(item.line_total);
      topProducts.set(item.product_id, cur);
    }
  }
  const topProductsList = [...topProducts.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const expenseByCategory = new Map<string, number>();
  for (const e of expenses) {
    const cat = e.category?.name ?? 'Lainnya';
    expenseByCategory.set(
      cat,
      (expenseByCategory.get(cat) ?? 0) + Number(e.amount ?? 0),
    );
  }
  const expenseList = [...expenseByCategory.entries()].sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>Top Produk berdasarkan Pendapatan</h2>
        </div>
        {topProductsList.length > 0 ? (
          <MiniBarChart
            data={topProductsList.map((p) => ({
              label: p.name,
              value: p.revenue,
              detail: `${p.qty}× · ${fmtRp(p.revenue)}`,
            }))}
          />
        ) : (
          <EmptyState title="Belum ada data produk" />
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Pengeluaran per Kategori</h2>
        </div>
        {expenseList.length > 0 ? (
          <MiniBarChart
            data={expenseList.map(([cat, amount]) => ({
              label: cat,
              value: amount,
              detail: fmtRp(amount),
            }))}
          />
        ) : (
          <EmptyState title="Belum ada data pengeluaran" />
        )}
      </section>
    </>
  );
}

function MiniBarChart({
  data,
}: {
  data: { label: string; value: number; color?: string; detail?: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="mini-barchart">
      {data.map((d) => (
        <div key={d.label} className="mini-barchart-row">
          <span className="mini-barchart-label" title={d.label}>
            {d.label.length > 20 ? d.label.slice(0, 20) + '…' : d.label}
          </span>
          <div className="mini-barchart-bar">
            <i
              style={{
                width: `${Math.max((d.value / max) * 100, 2)}%`,
                background: d.color ?? '#3b82f6',
              }}
            />
          </div>
          <span className="mini-barchart-value">
            {d.detail ?? fmtRp(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

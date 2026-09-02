import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api } from './api';
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

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

export function ExpensesPage({
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
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const branch = ctx.accessible_branches[0];
  const store = ctx.stores.find((x: any) => x.id === branch?.store_id);
  const [form, setForm] = useState({
    categoryId: '',
    amount: '0',
    description: '',
    paymentMethod: 'CASH',
  });

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api<any[]>('/expenses', token, company),
      api<any[]>('/expenses/categories', token, company).catch(() => []),
    ])
      .then(([a, b]) => {
        setRows(a);
        setCategories(b);
      })
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

  async function create(e: FormEvent) {
    e.preventDefault();
    setMsg('...');
    try {
      await api('/expenses', token, company, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          storeId: store?.id,
          branchId: branch?.id,
          expenseDate: new Date().toISOString().slice(0, 10),
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      setMsg(t('messages.saveSuccess'));
      setShowCreate(false);
      setForm({
        categoryId: '',
        amount: '0',
        description: '',
        paymentMethod: 'CASH',
      });
      load();
    } catch (e) {
      setMsg(
        e instanceof ApiError && e.status === 403
          ? '403 · permission denied'
          : t('messages.saveError'),
      );
    }
  }

  const totalToday = rows
    .filter((r) => r.expense_date === new Date().toISOString().slice(0, 10))
    .reduce((n: number, r: any) => n + Number(r.amount ?? 0), 0);

  const { page, pageCount, setPage, slice } = usePaged(rows);

  return (
    <>
      <div className="metrics">
        <StatCard
          label="Total Pengeluaran"
          value={`Rp ${Number(totalToday).toLocaleString('id-ID')}`}
          note="Hari ini"
        />
        <StatCard
          label="Jumlah Transaksi"
          value={String(rows.length)}
          note="Semua"
        />
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.expenses')}</h2>
          {ctx.permissions.includes('expense.create') && (
            <Button onClick={() => setShowCreate(true)}>
              + {t('pages.expenses')}
            </Button>
          )}
        </div>

        {loading ? (
          <LoadingState label={t('common.loading')} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : rows.length === 0 ? (
          <EmptyState title={t('dashboard.noData')} />
        ) : (
          <div className="table">
            <div className="tr head">
              {['Description', 'Category', 'Amount', 'Method', 'Date'].map(
                (k) => (
                  <span key={k}>{k}</span>
                ),
              )}
            </div>
            {slice.map((r: any) => (
              <div className="tr" key={r.id}>
                <span>{r.description ?? '—'}</span>
                <span>{r.category?.name ?? r.categoryId ?? '—'}</span>
                <span>Rp {Number(r.amount ?? 0).toLocaleString('id-ID')}</span>
                <span>{r.paymentMethod ?? '—'}</span>
                <span>{r.expense_date ?? '—'}</span>
              </div>
            ))}
          </div>
        )}

        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </section>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={`Tambah ${t('pages.expenses')}`}
        footer={
          <Button type="submit" form="expense-create-form">
            {t('common.save')}
          </Button>
        }
      >
        <form
          id="expense-create-form"
          className="inline-form"
          onSubmit={create}
        >
          <Field label="Category">
            <Select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Select</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount">
            <Input
              required
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <Input
              required
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <Field label="Payment method">
            <Select
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="QRIS">QRIS</option>
              <option value="E_WALLET">E-Wallet</option>
            </Select>
          </Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>
    </>
  );
}

export function FinancePage({
  view,
  company,
  token,
  ctx,
}: {
  view: 'reports' | 'payables' | 'receivables';
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
      .catch((e) =>
        setError(
          e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error',
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [path, company, token]);

  async function pay(row: any) {
    const amount = prompt('Payment amount', String(row.remaining_amount));
    if (amount) {
      try {
        await api(
          '/finance/' + view + '/' + row.id + '/payments',
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
    const fmtRp = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
    return (
      <section className="panel">
        <h2>{t('pages.reports')}</h2>
        {!data ? (
          <EmptyState title={t('dashboard.noData')} />
        ) : (
          <>
            <div className="metrics">
              {[
                ['revenue', 'Pendapatan'],
                ['cashReceived', 'Kas diterima'],
                ['expenses', 'Pengeluaran'],
                ['purchases', 'Pembelian'],
                ['refunds', 'Refund'],
                ['operatingCashResult', 'Hasil operasional kas'],
              ].map(([k, label]) => (
                <StatCard
                  key={k}
                  label={label}
                  value={fmtRp(Number(data[k] ?? 0))}
                  tone={
                    k === 'operatingCashResult'
                      ? Number(data[k] ?? 0) >= 0
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
    );
  }

  const items: any[] = Array.isArray(data) ? data : [];
  const permission =
    view === 'payables' ? 'payable.manage' : 'receivable.manage';

  return (
    <>
      <section className="panel">
        <h2>
          {view === 'payables' ? t('pages.payables') : t('pages.receivables')}
        </h2>
        {items.length === 0 ? (
          <EmptyState title={t('dashboard.noData')} />
        ) : (
          <div className="table">
            <div className="tr head">
              {['Description', 'Amount', 'Remaining', 'Status', 'Due'].map(
                (k) => (
                  <span key={k}>{k}</span>
                ),
              )}
            </div>
            {items.map((r: any) => (
              <button
                className="tr"
                key={r.id}
                onClick={() => ctx.permissions.includes(permission) && pay(r)}
                style={{
                  cursor: ctx.permissions.includes(permission)
                    ? 'pointer'
                    : 'default',
                }}
              >
                <span>
                  {r.description ??
                    r.purchase?.purchase_number ??
                    r.sale?.transaction_number ??
                    r.id}
                </span>
                <span>Rp {Number(r.amount ?? 0).toLocaleString('id-ID')}</span>
                <span>
                  Rp {Number(r.remaining_amount ?? 0).toLocaleString('id-ID')}
                </span>
                <span>
                  <StatusBadge status={r.status ?? 'PENDING'} />
                </span>
                <span>{r.due_date ?? '—'}</span>
              </button>
            ))}
          </div>
        )}
        {msg && <p className="muted">{msg}</p>}
      </section>
    </>
  );
}

export function Phase4Summary({
  company,
  token,
  permissions,
}: {
  company: string;
  token: string;
  permissions: string[];
}) {
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    const defs: [string, string, string][] = [
      ['suppliers', 'supplier.read', '/suppliers'],
      ['customers', 'customer.read', '/customers'],
      ['employees', 'employee.read', '/employees'],
      ['payables', 'payable.read', '/finance/payables'],
      ['receivables', 'receivable.read', '/finance/receivables'],
    ];
    const active = defs.filter((x) => permissions.includes(x[1]));
    Promise.all(active.map((x) => api<any[]>(x[2], token, company)))
      .then((v) =>
        setStats(Object.fromEntries(v.map((rows, i) => [active[i][0], rows]))),
      )
      .catch(() => undefined);
  }, [company, token]);

  const fmtRp = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

  return (
    <section className="metrics phase4-metrics">
      {['suppliers', 'customers', 'employees'].map((k) => (
        <article key={k}>
          <span>{k}</span>
          <strong>{stats[k]?.length ?? 0}</strong>
          <small>authorized real data</small>
        </article>
      ))}
      <article>
        <span>Outstanding payable</span>
        <strong>
          {fmtRp(
            (stats.payables ?? []).reduce(
              (n: number, x: any) => n + Number(x.remaining_amount),
              0,
            ),
          )}
        </strong>
      </article>
      <article>
        <span>Outstanding receivable</span>
        <strong>
          {fmtRp(
            (stats.receivables ?? []).reduce(
              (n: number, x: any) => n + Number(x.remaining_amount),
              0,
            ),
          )}
        </strong>
      </article>
    </section>
  );
}

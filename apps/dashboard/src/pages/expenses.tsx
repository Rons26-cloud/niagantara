import { FormEvent, useEffect, useState } from 'react';
import { ApiError, api } from '../api';
import {
  Button,
  Card,
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
import { CircleDollarSign, Plus } from 'lucide-react';

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
      .catch((e) => setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setMsg(t('common.saving'));
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
      setForm({ categoryId: '', amount: '0', description: '', paymentMethod: 'CASH' });
      load();
    } catch (e) {
      setMsg(
        e instanceof ApiError && e.status === 403
          ? '403 · permission denied'
          : t('messages.saveError'),
      );
    }
  }

  const fmtRp = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

  const today = new Date().toISOString().slice(0, 10);
  const totalToday = rows
    .filter((r) => r.expense_date === today)
    .reduce((n: number, r: any) => n + Number(r.amount ?? 0), 0);
  const totalAll = rows.reduce((n: number, r: any) => n + Number(r.amount ?? 0), 0);

  const { page, pageCount, setPage, slice } = usePaged(rows);

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="metrics">
        <StatCard label="Pengeluaran Hari Ini" value={fmtRp(totalToday)} note={today} />
        <StatCard label="Total Pengeluaran" value={fmtRp(totalAll)} note={`${rows.length} transaksi`} />
        <StatCard label="Kategori" value={String(categories.length)} />
        <StatCard label="Jumlah Transaksi" value={String(rows.length)} />
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.expenses')}</h2>
          {ctx.permissions.includes('expense.create') && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={14} /> + {t('pages.expenses')}
            </Button>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<CircleDollarSign size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada pengeluaran tercatat."
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {['Deskripsi', 'Kategori', 'Jumlah', 'Metode', 'Tanggal'].map(
                (k) => (
                  <span key={k}>{k}</span>
                ),
              )}
            </div>
            {slice.map((r: any) => (
              <div className="tr" key={r.id}>
                <span>{r.description ?? '—'}</span>
                <span>{r.category?.name ?? r.categoryId ?? '—'}</span>
                <span>{fmtRp(Number(r.amount ?? 0))}</span>
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
        <form id="expense-create-form" className="inline-form" onSubmit={create}>
          <Field label="Kategori">
            <Select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Pilih</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('common.amount')}>
            <Input
              required
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field label={t('common.description')}>
            <Input
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Metode Pembayaran">
            <Select
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
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

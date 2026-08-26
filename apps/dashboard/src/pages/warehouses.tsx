import { FormEvent, useEffect, useState } from 'react';
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
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import { Warehouse, Plus } from 'lucide-react';

type Warehouse = {
  id: string;
  name: string;
  code?: string;
  storeId?: string;
  store_id?: string;
  branchId?: string;
  branch_id?: string;
  status?: string;
  productCount?: number;
  stockSummary?: { totalStock: number; lowStock: number };
};

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

export function WarehousesPage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editRow, setEditRow] = useState<Warehouse | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    name: '',
    code: '',
    storeId: ctx.stores[0]?.id ?? '',
    branchId: ctx.accessible_branches[0]?.id ?? '',
  });

  const load = () => {
    setLoading(true);
    setError(null);
    api<Warehouse[]>('/warehouses', token, company)
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.code?.toLowerCase().includes(search.toLowerCase()),
  );

  const { page, pageCount, setPage, slice } = usePaged(filtered);

  async function create(e: FormEvent) {
    e.preventDefault();
    setMsg(t('common.saving'));
    try {
      await api('/warehouses', token, company, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMsg(t('messages.saveSuccess'));
      setShowCreate(false);
      setForm({ name: '', code: '', storeId: ctx.stores[0]?.id ?? '', branchId: ctx.accessible_branches[0]?.id ?? '' });
      load();
    } catch (e) {
      setMsg(
        e instanceof ApiError && e.status === 403
          ? '403 · permission denied'
          : t('messages.saveError'),
      );
    }
  }

  async function update(e: FormEvent) {
    e.preventDefault();
    if (!editRow) return;
    setMsg(t('common.saving'));
    try {
      await api('/warehouses/' + editRow.id, token, company, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setMsg(t('messages.saveSuccess'));
      setEditRow(null);
      load();
    } catch (e) {
      setMsg(
        e instanceof ApiError && e.status === 403
          ? '403 · permission denied'
          : t('messages.saveError'),
      );
    }
  }

  function openEdit(r: Warehouse) {
    setForm({ name: r.name, code: r.code ?? '', storeId: r.storeId ?? r.store_id ?? '', branchId: r.branchId ?? r.branch_id ?? '' });
    setEditRow(r);
  }

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="ng-filterbar">
        <Field label={t('common.search')}>
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        {ctx.permissions.includes('warehouse.manage') && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={14} /> {t('common.add')} {t('common.warehouse')}
          </Button>
        )}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.warehouses')}</h2>
          <span>{filtered.length} item</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Warehouse size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada gudang terdaftar. Klik tombol tambah untuk membuat gudang baru."
            action={
              ctx.permissions.includes('warehouse.manage') ? (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus size={14} /> {t('common.add')} {t('common.warehouse')}
                </Button>
              ) : undefined
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Warehouse size={28} />}
            title="Tidak ada hasil"
            description="Coba kata kunci lain."
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {['Nama', 'Kode', 'Toko', 'Cabang', 'Status', 'Produk', 'Aksi'].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {slice.map((r) => (
              <div className="tr" key={r.id}>
                <span>{r.name ?? '—'}</span>
                <span>{r.code ?? '—'}</span>
                <span>{ctx.stores.find((s) => s.id === (r.storeId ?? r.store_id))?.name ?? '—'}</span>
                <span>{ctx.accessible_branches.find((b) => b.id === (r.branchId ?? r.branch_id))?.name ?? '—'}</span>
                <span>
                  <StatusBadge status={r.status ?? 'ACTIVE'} />
                </span>
                <span>{r.productCount ?? 0}</span>
                <span>
                  {ctx.permissions.includes('warehouse.manage') && (
                    <Button variant="ghost" onClick={() => openEdit(r)}>
                      {t('common.edit')}
                    </Button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </section>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={`${t('common.create')} ${t('common.warehouse')}`}
        footer={
          <Button type="submit" form="warehouse-create-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="warehouse-create-form" className="inline-form" onSubmit={create}>
          <Field label={t('common.name')}>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Kode">
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </Field>
          <Field label={t('context.store')}>
            <Select
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            >
              {ctx.stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('context.branch')}>
            <Select
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            >
              {ctx.accessible_branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>

      <Modal
        open={!!editRow}
        onClose={() => setEditRow(null)}
        title={`${t('common.edit')} ${editRow?.name ?? ''}`}
        footer={
          <Button type="submit" form="warehouse-edit-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="warehouse-edit-form" className="inline-form" onSubmit={update}>
          <Field label={t('common.name')}>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Kode">
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </Field>
          <Field label={t('context.store')}>
            <Select
              value={form.storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
            >
              {ctx.stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('context.branch')}>
            <Select
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            >
              {ctx.accessible_branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>
    </>
  );
}

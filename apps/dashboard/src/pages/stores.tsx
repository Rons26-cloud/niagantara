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
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import { Store, Plus } from 'lucide-react';

type Store = {
  id: string;
  name: string;
  status?: string;
  branchCount?: number;
  planLimit?: { maxStores: number; maxBranches: number };
  createdAt?: string;
  created_at?: string;
};

type Ctx = {
  permissions: string[];
  stores: any[];
};

export function StoresPage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editRow, setEditRow] = useState<Store | null>(null);
  const [detailRow, setDetailRow] = useState<Store | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '' });

  const load = () => {
    setLoading(true);
    setError(null);
    api<Store[]>('/stores', token, company)
      .then(setRows)
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

  const filtered = rows.filter(
    (r) => !search || r.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const { page, pageCount, setPage, slice } = usePaged(filtered);

  async function create(e: FormEvent) {
    e.preventDefault();
    setMsg(t('common.saving'));
    try {
      await api('/stores', token, company, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMsg(t('messages.saveSuccess'));
      setShowCreate(false);
      setForm({ name: '' });
      load();
    } catch (e) {
      setMsg(
        e instanceof ApiError && e.status === 403
          ? '403 · permission denied - mungkin limit plan tercapai'
          : t('messages.saveError'),
      );
    }
  }

  async function update(e: FormEvent) {
    e.preventDefault();
    if (!editRow) return;
    setMsg(t('common.saving'));
    try {
      await api('/stores/' + editRow.id, token, company, {
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

  function openEdit(r: Store) {
    setForm({ name: r.name });
    setEditRow(r);
  }

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const canCreate = ctx.permissions.includes('store.manage');

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
        {canCreate && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={14} /> {t('common.add')} {t('common.store')}
          </Button>
        )}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.stores')}</h2>
          <span>{filtered.length} item</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Store size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada toko terdaftar. Klik tombol tambah untuk membuat toko baru."
            action={
              canCreate ? (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus size={14} /> {t('common.add')} {t('common.store')}
                </Button>
              ) : undefined
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Store size={28} />}
            title="Tidak ada hasil"
            description="Coba kata kunci lain."
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {['Nama', 'Status', 'Jumlah Cabang', 'Dibuat', 'Aksi'].map(
                (k) => (
                  <span key={k}>{k}</span>
                ),
              )}
            </div>
            {slice.map((r) => (
              <div className="tr" key={r.id}>
                <span>{r.name ?? '—'}</span>
                <span>
                  <StatusBadge status={r.status ?? 'ACTIVE'} />
                </span>
                <span>{r.branchCount ?? 0}</span>
                <span>
                  {(r.createdAt ?? r.created_at)
                    ? new Date(
                        (r.createdAt ?? r.created_at)!,
                      ).toLocaleDateString('id-ID')
                    : '—'}
                </span>
                <span>
                  <Button variant="ghost" onClick={() => setDetailRow(r)}>
                    Detail
                  </Button>
                  {ctx.permissions.includes('store.manage') && (
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

      <Modal open={!!detailRow} onClose={() => setDetailRow(null)} title={`Detail Toko · ${detailRow?.name ?? ''}`} footer={<Button variant="ghost" onClick={() => setDetailRow(null)}>Tutup</Button>}>
        {detailRow && <div className="def-grid"><dt>Nama Toko</dt><dd>{detailRow.name}</dd><dt>Status</dt><dd><StatusBadge status={detailRow.status ?? 'ACTIVE'} /></dd><dt>Jumlah Cabang</dt><dd>{detailRow.branchCount ?? 0}</dd><dt>Batas Toko</dt><dd>{detailRow.planLimit?.maxStores ?? '—'}</dd><dt>Batas Cabang</dt><dd>{detailRow.planLimit?.maxBranches ?? '—'}</dd><dt>Dibuat</dt><dd>{(detailRow.createdAt ?? detailRow.created_at) ? new Date((detailRow.createdAt ?? detailRow.created_at)!).toLocaleDateString('id-ID') : '—'}</dd></div>}
      </Modal>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={`${t('common.create')} ${t('common.store')}`}
        footer={
          <Button type="submit" form="store-create-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="store-create-form" className="inline-form" onSubmit={create}>
          <Field label={t('common.name')}>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>

      <Modal
        open={!!editRow}
        onClose={() => setEditRow(null)}
        title={`${t('common.edit')} ${editRow?.name ?? ''}`}
        footer={
          <Button type="submit" form="store-edit-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="store-edit-form" className="inline-form" onSubmit={update}>
          <Field label={t('common.name')}>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>
    </>
  );
}

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
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import { Tags, Plus } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  product_count?: number;
};

type Ctx = {
  permissions: string[];
};

export function CategoriesPage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editRow, setEditRow] = useState<Category | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });

  const load = () => {
    setLoading(true);
    setError(null);
    api<Category[]>('/categories', token, company)
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error'))
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
      await api('/categories', token, company, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMsg(t('messages.saveSuccess'));
      setShowCreate(false);
      setForm({ name: '', description: '' });
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
      await api('/categories/' + editRow.id, token, company, {
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

  function openEdit(r: Category) {
    setForm({ name: r.name, description: r.description ?? '' });
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
        {ctx.permissions.includes('category.manage') && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={14} /> {t('common.add')} {t('common.category')}
          </Button>
        )}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.categories')}</h2>
          <span>{filtered.length} item</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Tags size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada kategori. Klik tombol tambah untuk membuat kategori baru."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Tags size={28} />}
            title="Tidak ada hasil"
            description="Coba kata kunci lain."
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {['Nama', 'Deskripsi', 'Status', 'Produk', 'Aksi'].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {slice.map((r) => (
              <div className="tr" key={r.id}>
                <span>{r.name ?? '—'}</span>
                <span>{r.description ?? '—'}</span>
                <span>
                  <StatusBadge status={r.status ?? 'ACTIVE'} />
                </span>
                <span>{r.product_count ?? 0}</span>
                <span>
                  {ctx.permissions.includes('category.manage') && (
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
        title={`${t('common.create')} ${t('common.category')}`}
        footer={
          <Button type="submit" form="cat-create-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="cat-create-form" className="inline-form" onSubmit={create}>
          <Field label={t('common.name')}>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label={t('common.description')}>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
          <Button type="submit" form="cat-edit-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="cat-edit-form" className="inline-form" onSubmit={update}>
          <Field label={t('common.name')}>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label={t('common.description')}>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>
    </>
  );
}

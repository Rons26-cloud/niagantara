import { FormEvent, useEffect, useState, useCallback } from 'react';
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
import { Tags, Plus, Download, Upload, GripVertical, ArrowUpDown } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  product_count?: number;
  color?: string;
};

type Ctx = {
  permissions: string[];
};

const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#0ea5e9', '#a855f7', '#64748b',
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: c,
            border: value === c ? '3px solid var(--text-primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'transform 0.15s',
            transform: value === c ? 'scale(1.2)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  );
}

function ProductCountBar({ count, max }: { count: number; max: number }) {
  const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0;
  const color = count <= 0 ? 'var(--text-muted)' : pct < 33 ? 'var(--color-warning, #f59e0b)' : pct < 66 ? 'var(--color-primary, #3b82f6)' : 'var(--color-success, #22c55e)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-secondary, #f3f4f6)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', minWidth: 20, textAlign: 'right' }}>{count}</span>
    </div>
  );
}

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
  const [sortBy, setSortBy] = useState<'name' | 'count' | 'date'>('name');
  const [showImport, setShowImport] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#3b82f6', status: 'ACTIVE' });

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

  const maxCount = Math.max(...rows.map((r) => r.product_count ?? 0), 1);

  const filtered = rows.filter(
    (r) => !search || r.name?.toLowerCase().includes(search.toLowerCase()),
  ).sort((a, b) => {
    if (sortBy === 'count') return (b.product_count ?? 0) - (a.product_count ?? 0);
    if (sortBy === 'date') return (b.id ?? '').localeCompare(a.id ?? '');
    return (a.name ?? '').localeCompare(b.name ?? '');
  });

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
      setForm({ name: '', description: '', color: '#3b82f6', status: 'ACTIVE' });
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

  async function toggleStatus(r: Category) {
    try {
      await api('/categories/' + r.id, token, company, {
        method: 'PATCH',
        body: JSON.stringify({ status: r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
      });
      load();
    } catch {
      setMsg(t('messages.saveError'));
    }
  }

  function openEdit(r: Category) {
    setForm({ name: r.name, description: r.description ?? '', color: r.color ?? '#3b82f6', status: r.status ?? 'ACTIVE' });
    setEditRow(r);
  }

  const handleDragStart = useCallback((id: string) => setDragId(id), []);
  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);
  const handleDrop = useCallback(() => setDragId(null), []);

  const handleExport = useCallback(() => {
    const data = rows.map((r) => ({ name: r.name, description: r.description, product_count: r.product_count }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="ng-filterbar">
        <Field label={t('common.search')}>
          <Input
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <Field label="Urutkan">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ padding: '0.4rem 0.5rem', borderRadius: 6, border: '1px solid var(--border, #d1d5db)', background: 'var(--bg-primary, #fff)', color: 'var(--text-primary)' }}
          >
            <option value="name">Nama</option>
            <option value="count">Jumlah Produk</option>
            <option value="date">Tanggal</option>
          </select>
        </Field>
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <Button variant="ghost" onClick={handleExport}>
            <Download size={14} /> Export
          </Button>
          <Button variant="ghost" onClick={() => setShowImport(true)}>
            <Upload size={14} /> Import
          </Button>
          {ctx.permissions.includes('category.manage') && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={14} /> {t('common.add')} {t('common.category')}
            </Button>
          )}
        </div>
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
              {['', 'Nama', 'Deskripsi', 'Status', 'Produk', 'Aksi'].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {slice.map((r) => (
              <div
                className="tr"
                key={r.id}
                draggable
                onDragStart={() => handleDragStart(r.id)}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{ opacity: dragId === r.id ? 0.5 : 1, cursor: 'grab' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GripVertical size={14} style={{ color: 'var(--text-muted)' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: r.color ?? '#3b82f6', flexShrink: 0 }} />
                </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.name ?? '—'}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.description ?? '—'}
                </span>
                <span>
                  <button
                    onClick={() => ctx.permissions.includes('category.manage') && toggleStatus(r)}
                    style={{
                      background: (r.status ?? 'ACTIVE') === 'ACTIVE' ? 'var(--color-success, #22c55e)' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: 12,
                      padding: '2px 8px',
                      color: '#fff',
                      fontSize: '0.75rem',
                      cursor: ctx.permissions.includes('category.manage') ? 'pointer' : 'default',
                      fontWeight: 600,
                    }}
                  >
                    {(r.status ?? 'ACTIVE') === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                  </button>
                </span>
                <span style={{ minWidth: 120 }}>
                  <ProductCountBar count={r.product_count ?? 0} max={maxCount} />
                </span>
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
              placeholder="Deskripsi singkat kategori..."
            />
          </Field>
          <Field label="Warna">
            <ColorPicker value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
          </Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: form.color }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Preview: {form.name || 'Nama kategori'}</span>
          </div>
          {msg && <p style={{ color: 'var(--text-muted)' }}>{msg}</p>}
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
          <Field label="Warna">
            <ColorPicker value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
          </Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: form.color }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Preview: {form.name || 'Nama kategori'}</span>
          </div>
          {msg && <p style={{ color: 'var(--text-muted)' }}>{msg}</p>}
        </form>
      </Modal>

      <Modal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import Kategori"
        footer={<Button onClick={() => setShowImport(false)}>Tutup</Button>}
      >
        <div style={{ padding: '1rem 0', textAlign: 'center' }}>
          <Upload size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Upload JSON / CSV</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Format: Nama, Deskripsi, Warna
          </p>
          <div style={{ marginTop: '1rem', padding: '2rem', border: '2px dashed var(--border, #d1d5db)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)' }}>
            Klik atau seret file ke sini
          </div>
        </div>
      </Modal>
    </>
  );
}

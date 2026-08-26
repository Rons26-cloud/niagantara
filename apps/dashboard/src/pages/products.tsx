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
import { Edit, Package, Plus, Tag, TrendingDown } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  sellingPrice?: number;
  selling_price?: number;
  costPrice?: number;
  cost_price?: number;
  stock?: number;
  minimumStock?: number;
  status?: string;
  category?: { id: string; name: string };
  categoryId?: string;
  category_id?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

export function ProductsPage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    costPrice: '0',
    sellingPrice: '0',
    minimumStock: '0',
    categoryId: '',
  });

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api<Product[]>('/products', token, company),
      api<any[]>('/categories', token, company).catch(() => []),
    ])
      .then(([p, c]) => { setRows(p); setCategories(c); })
      .catch((e) => setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { void load(); }, [company, token]);

  const filtered = rows.filter(
    (r) =>
      (!search ||
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.sku?.toLowerCase().includes(search.toLowerCase()) ||
        r.barcode?.toLowerCase().includes(search.toLowerCase())) &&
      (!filterCategory || (r.categoryId ?? r.category_id) === filterCategory),
  );

  const { page, pageCount, setPage, slice } = usePaged(filtered);
  const fmtRp = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

  const totalProducts = rows.length;
  const activeProducts = rows.filter((r) => r.status === 'ACTIVE').length;
  const lowStockCount = rows.filter((r) => (r.stock ?? 0) > 0 && (r.stock ?? 0) <= (r.minimumStock ?? 0)).length;
  const outOfStockCount = rows.filter((r) => (r.stock ?? 0) <= 0).length;

  async function create(e: FormEvent) {
    e.preventDefault();
    setMsg(t('common.saving'));
    try {
      await api('/products', token, company, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          costPrice: Number(form.costPrice),
          sellingPrice: Number(form.sellingPrice),
          minimumStock: Number(form.minimumStock),
        }),
      });
      setMsg('✓ Produk berhasil ditambahkan.');
      setShowCreate(false);
      resetForm();
      load();
    } catch (e) {
      setMsg(e instanceof ApiError && e.status === 403 ? '403 · permission denied' : t('messages.saveError'));
    }
  }

  async function update(e: FormEvent) {
    e.preventDefault();
    if (!editProduct) return;
    setMsg(t('common.saving'));
    try {
      await api('/products/' + editProduct.id, token, company, {
        method: 'PATCH',
        body: JSON.stringify({
          ...form,
          costPrice: Number(form.costPrice),
          sellingPrice: Number(form.sellingPrice),
          minimumStock: Number(form.minimumStock),
        }),
      });
      setMsg('✓ Produk berhasil diperbarui.');
      setEditProduct(null);
      resetForm();
      load();
    } catch {
      setMsg(t('messages.saveError'));
    }
  }

  function resetForm() {
    setForm({ name: '', sku: '', barcode: '', description: '', costPrice: '0', sellingPrice: '0', minimumStock: '0', categoryId: '' });
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      sku: p.sku ?? '',
      barcode: p.barcode ?? '',
      description: p.description ?? '',
      costPrice: String(p.costPrice ?? p.cost_price ?? 0),
      sellingPrice: String(p.sellingPrice ?? p.selling_price ?? 0),
      minimumStock: String(p.minimumStock ?? 0),
      categoryId: p.categoryId ?? p.category_id ?? '',
    });
    setEditProduct(p);
  }

  async function openDetail(r: Product) {
    try {
      setDetail(await api<Product>('/products/' + r.id, token, company));
    } catch {
      setDetail(r);
    }
  }

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="metrics">
        <StatCard label="Total Produk" value={String(totalProducts)} />
        <StatCard label="Aktif" value={String(activeProducts)} tone="success" />
        <StatCard label="Stok Rendah" value={String(lowStockCount)} tone={lowStockCount > 0 ? 'warning' : 'default'} />
        <StatCard label="Stok Habis" value={String(outOfStockCount)} tone={outOfStockCount > 0 ? 'danger' : 'default'} />
      </div>

      <div className="ng-filterbar">
        <Field label={t('common.search')}>
          <Input
            placeholder="Cari nama, SKU, atau barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <Field label={t('common.category')}>
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Semua Kategori</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        {ctx.permissions.includes('product.create') && (
          <Button onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus size={14} /> Tambah Produk
          </Button>
        )}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.products')}</h2>
          <span>{filtered.length} item</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada produk. Klik tombol tambah untuk membuat produk baru."
            action={
              ctx.permissions.includes('product.create') ? (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus size={14} /> Tambah Produk
                </Button>
              ) : undefined
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Package size={28} />} title="Tidak ada hasil" description="Coba kata kunci atau filter lain." />
        ) : (
          <div className="table">
            <div className="tr head">
              {['Produk', 'SKU', 'Kategori', 'Harga Beli', 'Harga Jual', 'Margin', 'Stok', 'Min', 'Status', 'Aksi'].map(
                (k) => (<span key={k}>{k}</span>),
              )}
            </div>
            {slice.map((r) => {
              const margin = (r.sellingPrice ?? r.selling_price ?? 0) > 0 && (r.costPrice ?? r.cost_price ?? 0) > 0
                ? Math.round(((Number(r.sellingPrice ?? r.selling_price) - Number(r.costPrice ?? r.cost_price)) / Number(r.costPrice ?? r.cost_price)) * 100)
                : 0;
              return (
                <div className="tr" key={r.id}>
                  <span>
                    <button className="product-name-btn" onClick={() => openDetail(r)}>
                      <b>{r.name}</b>
                      {r.barcode && <small>{r.barcode}</small>}
                    </button>
                  </span>
                  <span><code>{r.sku ?? '—'}</code></span>
                  <span>{r.category?.name ?? '—'}</span>
                  <span>{fmtRp(Number(r.costPrice ?? r.cost_price ?? 0))}</span>
                  <span><b>{fmtRp(Number(r.sellingPrice ?? r.selling_price ?? 0))}</b></span>
                  <span className={margin > 0 ? 'product-margin-positive' : 'product-margin-zero'}>
                    {margin > 0 ? `+${margin}%` : '—'}
                  </span>
                  <span>
                    <span className={
                      (r.stock ?? 0) <= 0 ? 'stock-badge stock-empty' :
                      (r.stock ?? 0) <= (r.minimumStock ?? 0) ? 'stock-badge stock-low' :
                      'stock-badge stock-ok'
                    }>
                      {r.stock ?? 0}
                    </span>
                  </span>
                  <span>{r.minimumStock ?? 0}</span>
                  <span><StatusBadge status={r.status ?? 'ACTIVE'} /></span>
                  <span>
                    {ctx.permissions.includes('product.create') && (
                      <Button variant="ghost" onClick={() => openEdit(r)}>
                        <Edit size={14} />
                      </Button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </section>

      {detail && (
        <section className="panel">
          <div className="panel-head">
            <h2>{detail.name}</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {ctx.permissions.includes('product.create') && (
                <Button variant="ghost" onClick={() => { openEdit(detail); setDetail(null); }}>
                  <Edit size={14} /> Edit
                </Button>
              )}
              <Button variant="ghost" onClick={() => setDetail(null)}>Tutup</Button>
            </div>
          </div>
          <div className="product-detail-grid">
            <div className="product-detail-section">
              <h3>Informasi Produk</h3>
              <dl className="def-grid">
                <dt>SKU</dt><dd><code>{detail.sku ?? '—'}</code></dd>
                <dt>Barcode</dt><dd><code>{detail.barcode ?? '—'}</code></dd>
                <dt>Kategori</dt><dd>{detail.category?.name ?? '—'}</dd>
                <dt>Status</dt><dd><StatusBadge status={detail.status ?? 'ACTIVE'} /></dd>
              </dl>
            </div>
            <div className="product-detail-section">
              <h3>Harga</h3>
              <dl className="def-grid">
                <dt>Harga Beli</dt><dd>{fmtRp(Number(detail.costPrice ?? detail.cost_price ?? 0))}</dd>
                <dt>Harga Jual</dt><dd><b>{fmtRp(Number(detail.sellingPrice ?? detail.selling_price ?? 0))}</b></dd>
                <dt>Margin</dt><dd>
                  {(detail.sellingPrice ?? detail.selling_price ?? 0) > 0 && (detail.costPrice ?? detail.cost_price ?? 0) > 0
                    ? `${Math.round(((Number(detail.sellingPrice ?? detail.selling_price) - Number(detail.costPrice ?? detail.cost_price)) / Number(detail.costPrice ?? detail.cost_price)) * 100)}%`
                    : '—'}
                </dd>
              </dl>
            </div>
            <div className="product-detail-section">
              <h3>Stok</h3>
              <dl className="def-grid">
                <dt>Stok Saat Ini</dt><dd>{detail.stock ?? 0}</dd>
                <dt>Minimum Stok</dt><dd>{detail.minimumStock ?? 0}</dd>
                <dt>Kondisi</dt><dd>
                  {(detail.stock ?? 0) <= 0 ? '🔴 Habis' :
                   (detail.stock ?? 0) <= (detail.minimumStock ?? 0) ? '🟡 Rendah' :
                   '🟢 Aman'}
                </dd>
              </dl>
            </div>
          </div>
          {detail.created_at && (
            <p className="muted" style={{ marginTop: '1rem' }}>
              Dibuat: {new Date(detail.created_at).toLocaleString('id-ID')}
              {detail.updated_at && ` · Diperbarui: ${new Date(detail.updated_at).toLocaleString('id-ID')}`}
            </p>
          )}
        </section>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tambah Produk"
        footer={<Button type="submit" form="product-form">{t('common.save')}</Button>}
      >
        <form id="product-form" className="inline-form" onSubmit={create}>
          <Field label="Nama Produk">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="SKU">
            <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Auto-generate jika kosong" />
          </Field>
          <Field label="Barcode">
            <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </Field>
          <Field label="Deskripsi">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Kategori">
            <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">— Pilih —</option>
              {categories.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </Select>
          </Field>
          <Field label="Harga Beli (Cost)">
            <Input type="number" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
          </Field>
          <Field label="Harga Jual">
            <Input type="number" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
          </Field>
          <Field label="Minimum Stok">
            <Input type="number" min="0" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} />
          </Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>

      <Modal
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        title={`Edit — ${editProduct?.name ?? ''}`}
        footer={<Button type="submit" form="product-form">{t('common.save')}</Button>}
      >
        <form id="product-form" className="inline-form" onSubmit={update}>
          <Field label="Nama Produk">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="SKU">
            <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </Field>
          <Field label="Barcode">
            <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </Field>
          <Field label="Deskripsi">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Kategori">
            <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">— Pilih —</option>
              {categories.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </Select>
          </Field>
          <Field label="Harga Beli (Cost)">
            <Input type="number" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
          </Field>
          <Field label="Harga Jual">
            <Input type="number" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
          </Field>
          <Field label="Minimum Stok">
            <Input type="number" min="0" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} />
          </Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>
    </>
  );
}

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
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import { Package, Plus } from 'lucide-react';

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
  category?: { name: string };
  categoryId?: string;
  category_id?: string;
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
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
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
      .then(([p, c]) => {
        setRows(p);
        setCategories(c);
      })
      .catch((e) =>
        setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

  const filtered = rows.filter(
    (r) =>
      (!search ||
        r.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.sku?.toLowerCase().includes(search.toLowerCase())) &&
      (!filterCategory || (r.categoryId ?? r.category_id) === filterCategory),
  );

  const { page, pageCount, setPage, slice } = usePaged(filtered);

  const fmtRp = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

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
      setMsg(t('messages.saveSuccess'));
      setShowCreate(false);
      setForm({ name: '', sku: '', barcode: '', costPrice: '0', sellingPrice: '0', minimumStock: '0', categoryId: '' });
      load();
    } catch (e) {
      setMsg(
        e instanceof ApiError && e.status === 403
          ? '403 · permission denied'
          : t('messages.saveError'),
      );
    }
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
      <div className="ng-filterbar">
        <Field label={t('common.search')}>
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <Field label={t('common.category')}>
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">{t('pos.allProducts')}</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        {ctx.permissions.includes('product.create') && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={14} /> {t('common.add')} {t('common.product')}
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
                  <Plus size={14} /> {t('common.add')} {t('common.product')}
                </Button>
              ) : undefined
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="Tidak ada hasil"
            description="Coba kata kunci atau filter lain."
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {['Produk', 'SKU', 'Barcode', 'Kategori', 'Harga Jual', 'Stok', 'Min Stok', 'Status'].map(
                (k) => (
                  <span key={k}>{k}</span>
                ),
              )}
            </div>
            {slice.map((r) => (
              <button
                className="tr"
                key={r.id}
                onClick={() => openDetail(r)}
                style={{ cursor: 'pointer' }}
              >
                <span>{r.name ?? '—'}</span>
                <span>{r.sku ?? '—'}</span>
                <span>{r.barcode ?? '—'}</span>
                <span>{r.category?.name ?? '—'}</span>
                <span>{fmtRp(Number(r.sellingPrice ?? r.selling_price ?? 0))}</span>
                <span>{r.stock ?? '—'}</span>
                <span>{r.minimumStock ?? 0}</span>
                <span>
                  <StatusBadge status={r.status ?? 'ACTIVE'} />
                </span>
              </button>
            ))}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </section>

      {detail && (
        <section className="panel">
          <div className="panel-head">
            <h2>{detail.name}</h2>
            <Button variant="ghost" onClick={() => setDetail(null)}>
              {t('common.close')}
            </Button>
          </div>
          <dl className="def-grid">
            <dt>SKU</dt>
            <dd>{detail.sku ?? '—'}</dd>
            <dt>Barcode</dt>
            <dd>{detail.barcode ?? '—'}</dd>
            <dt>Kategori</dt>
            <dd>{detail.category?.name ?? '—'}</dd>
            <dt>Harga Beli</dt>
            <dd>{fmtRp(Number(detail.costPrice ?? detail.cost_price ?? 0))}</dd>
            <dt>Harga Jual</dt>
            <dd>{fmtRp(Number(detail.sellingPrice ?? detail.selling_price ?? 0))}</dd>
            <dt>Stok</dt>
            <dd>{detail.stock ?? '—'}</dd>
            <dt>Minimum Stok</dt>
            <dd>{detail.minimumStock ?? 0}</dd>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={detail.status ?? 'ACTIVE'} />
            </dd>
          </dl>
        </section>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={`${t('common.create')} ${t('common.product')}`}
        footer={
          <Button type="submit" form="product-create-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="product-create-form" className="inline-form" onSubmit={create}>
          <Field label={t('common.name')}>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="SKU">
            <Input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </Field>
          <Field label="Barcode">
            <Input
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
          </Field>
          <Field label={t('common.category')}>
            <Select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">—</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('demo.costPrice')}>
            <Input
              type="number"
              min="0"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            />
          </Field>
          <Field label={t('demo.sellingPrice')}>
            <Input
              type="number"
              min="0"
              value={form.sellingPrice}
              onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
            />
          </Field>
          <Field label={t('demo.minimumStock')}>
            <Input
              type="number"
              min="0"
              value={form.minimumStock}
              onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
            />
          </Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>
    </>
  );
}

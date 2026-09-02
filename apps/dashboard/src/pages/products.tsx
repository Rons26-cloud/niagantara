import { FormEvent, useEffect, useState, useRef, useCallback } from 'react';
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
import {
  Edit,
  Package,
  Plus,
  Tag,
  TrendingDown,
  QrCode,
  Image,
  Upload,
  X,
  Printer,
  Download,
} from 'lucide-react';

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

function QrCodeDisplay({
  value,
  size = 160,
}: {
  value: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    const cellSize = Math.floor(size / 25);
    const qrSize = cellSize * 25;
    canvas.width = qrSize;
    canvas.height = qrSize;
    ctx2d.fillStyle = '#ffffff';
    ctx2d.fillRect(0, 0, qrSize, qrSize);
    ctx2d.fillStyle = '#000000';
    const seed = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = (i: number) => {
      const x = Math.sin(seed * 9301 + i * 49297) * 49297;
      return x - Math.floor(x);
    };
    const drawFinderPattern = (ox: number, oy: number) => {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          if (
            y === 0 ||
            y === 6 ||
            x === 0 ||
            x === 6 ||
            (x >= 2 && x <= 4 && y >= 2 && y <= 4)
          ) {
            ctx2d.fillRect(
              (ox + x) * cellSize,
              (oy + y) * cellSize,
              cellSize,
              cellSize,
            );
          }
        }
      }
    };
    drawFinderPattern(0, 0);
    drawFinderPattern(18, 0);
    drawFinderPattern(0, 18);
    for (let x = 8; x < 17; x++) {
      if (x % 2 === 0)
        ctx2d.fillRect(x * cellSize, 6 * cellSize, cellSize, cellSize);
    }
    for (let y = 8; y < 17; y++) {
      if (y % 2 === 0)
        ctx2d.fillRect(6 * cellSize, y * cellSize, cellSize, cellSize);
    }
    for (let y = 0; y < 25; y++) {
      for (let x = 0; x < 25; x++) {
        if (
          (x < 8 && y < 8) ||
          (x > 16 && y < 8) ||
          (x < 8 && y > 16) ||
          x === 6 ||
          y === 6
        )
          continue;
        if (rng(y * 25 + x) > 0.5) {
          ctx2d.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
    />
  );
}

function BarcodeDisplay({
  value,
  height = 60,
}: {
  value: string;
  height?: number;
}) {
  const seed = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const bars: number[] = [];
  const rng = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 49297;
    return x - Math.floor(x);
  };
  for (let i = 0; i < value.length * 4 + 10; i++) {
    bars.push(rng(i) > 0.4 ? 1 : rng(i) > 0.2 ? 2 : 3);
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'end',
        gap: 0,
        height,
        padding: '4px 0',
      }}
    >
      {bars.map((w, i) => (
        <div
          key={i}
          style={{
            width: w,
            height: i % 2 === 0 ? height : height - 8,
            backgroundColor:
              i % 2 === 0 ? 'var(--text-primary)' : 'transparent',
          }}
        />
      ))}
    </div>
  );
}

function StockMiniChart({
  stock,
  minimum,
}: {
  stock: number;
  minimum: number;
}) {
  const max = Math.max(stock, minimum, 10);
  const bars = Array.from({ length: 7 }, (_, i) => {
    const base = Math.max(0, stock - 3 + i);
    return Math.min(base, max);
  });
  return (
    <div style={{ display: 'flex', alignItems: 'end', gap: 2, height: 32 }}>
      {bars.map((v, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: Math.max(2, (v / max) * 32),
            borderRadius: 2,
            backgroundColor:
              v <= 0
                ? 'var(--color-danger, #ef4444)'
                : v <= minimum
                  ? 'var(--color-warning, #f59e0b)'
                  : 'var(--color-success, #22c55e)',
            opacity: 0.3 + (i / 6) * 0.7,
          }}
        />
      ))}
    </div>
  );
}

function ImagePlaceholder({ name }: { name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 8,
        background:
          'linear-gradient(135deg, var(--color-primary, #3b82f6) 0%, var(--color-primary-hover, #2563eb) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: 14,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

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
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [sortField, setSortField] = useState<'name' | 'stock' | 'margin'>(
    'name',
  );
  const [showBulkImport, setShowBulkImport] = useState(false);
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
      .then(([p, c]) => {
        setRows(p);
        setCategories(c);
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

  const filtered = rows
    .filter(
      (r) =>
        (!search ||
          r.name?.toLowerCase().includes(search.toLowerCase()) ||
          r.sku?.toLowerCase().includes(search.toLowerCase()) ||
          r.barcode?.toLowerCase().includes(search.toLowerCase())) &&
        (!filterCategory || (r.categoryId ?? r.category_id) === filterCategory),
    )
    .sort((a, b) => {
      if (sortField === 'name')
        return (a.name ?? '').localeCompare(b.name ?? '');
      if (sortField === 'stock') return (b.stock ?? 0) - (a.stock ?? 0);
      const am =
        (a.sellingPrice ?? 0) > 0 && (a.costPrice ?? 0) > 0
          ? ((a.sellingPrice! - a.costPrice!) / a.costPrice!) * 100
          : 0;
      const bm =
        (b.sellingPrice ?? 0) > 0 && (b.costPrice ?? 0) > 0
          ? ((b.sellingPrice! - b.costPrice!) / b.costPrice!) * 100
          : 0;
      return bm - am;
    });

  const { page, pageCount, setPage, slice } = usePaged(filtered);
  const fmtRp = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

  const totalProducts = rows.length;
  const activeProducts = rows.filter((r) => r.status === 'ACTIVE').length;
  const lowStockCount = rows.filter(
    (r) => (r.stock ?? 0) > 0 && (r.stock ?? 0) <= (r.minimumStock ?? 0),
  ).length;
  const outOfStockCount = rows.filter((r) => (r.stock ?? 0) <= 0).length;
  const totalStockValue = rows.reduce(
    (s, r) => s + (r.stock ?? 0) * (r.costPrice ?? r.cost_price ?? 0),
    0,
  );

  async function create(e: FormEvent) {
    e.preventDefault();
    setMsg(t('common.saving'));
    try {
      const created = await api<Product>('/products', token, company, {
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
      if (created?.barcode || created?.sku) {
        setQrProduct(created);
      }
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
    setForm({
      name: '',
      sku: '',
      barcode: '',
      description: '',
      costPrice: '0',
      sellingPrice: '0',
      minimumStock: '0',
      categoryId: '',
    });
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

  const handlePrintQr = useCallback(() => {
    window.print();
  }, []);

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="metrics">
        <StatCard label="Total Produk" value={String(totalProducts)} />
        <StatCard label="Aktif" value={String(activeProducts)} tone="success" />
        <StatCard
          label="Stok Rendah"
          value={String(lowStockCount)}
          tone={lowStockCount > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Stok Habis"
          value={String(outOfStockCount)}
          tone={outOfStockCount > 0 ? 'danger' : 'default'}
        />
        <StatCard label="Nilai Stok" value={fmtRp(totalStockValue)} />
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
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Urutkan">
          <Select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
          >
            <option value="name">Nama</option>
            <option value="stock">Stok</option>
            <option value="margin">Margin</option>
          </Select>
        </Field>
        {ctx.permissions.includes('product.create') && (
          <>
            <Button
              onClick={() => {
                resetForm();
                setShowCreate(true);
              }}
            >
              <Plus size={14} /> Tambah Produk
            </Button>
            <Button variant="ghost" onClick={() => setShowBulkImport(true)}>
              <Upload size={14} /> Import
            </Button>
          </>
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
          <EmptyState
            icon={<Package size={28} />}
            title="Tidak ada hasil"
            description="Coba kata kunci atau filter lain."
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {[
                'Produk',
                'SKU',
                'Kategori',
                'Harga Beli',
                'Harga Jual',
                'Margin',
                'Stok',
                'Min',
                'Status',
                'Aksi',
              ].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {slice.map((r) => {
              const selling = Number(r.sellingPrice ?? r.selling_price ?? 0);
              const cost = Number(r.costPrice ?? r.cost_price ?? 0);
              const margin =
                selling > 0 && cost > 0
                  ? Math.round(((selling - cost) / cost) * 100)
                  : 0;
              return (
                <div className="tr" key={r.id}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <ImagePlaceholder name={r.name ?? 'PR'} />
                    <button
                      className="product-name-btn"
                      onClick={() => openDetail(r)}
                    >
                      <b style={{ color: 'var(--text-primary)' }}>{r.name}</b>
                      {r.barcode && (
                        <small style={{ color: 'var(--text-muted)' }}>
                          {r.barcode}
                        </small>
                      )}
                    </button>
                  </span>
                  <span>
                    <code>{r.sku ?? '—'}</code>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {r.category?.name ?? '—'}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {fmtRp(cost)}
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    <b>{fmtRp(selling)}</b>
                  </span>
                  <span
                    style={{
                      color:
                        margin > 0
                          ? 'var(--color-success, #22c55e)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {margin > 0 ? `+${margin}%` : '—'}
                  </span>
                  <span>
                    <span
                      className={
                        (r.stock ?? 0) <= 0
                          ? 'stock-badge stock-empty'
                          : (r.stock ?? 0) <= (r.minimumStock ?? 0)
                            ? 'stock-badge stock-low'
                            : 'stock-badge stock-ok'
                      }
                    >
                      {r.stock ?? 0}
                    </span>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {r.minimumStock ?? 0}
                  </span>
                  <span>
                    <StatusBadge status={r.status ?? 'ACTIVE'} />
                  </span>
                  <span style={{ display: 'flex', gap: '0.25rem' }}>
                    <Button
                      variant="ghost"
                      onClick={() => setQrProduct(r)}
                      title="QR Code"
                    >
                      <QrCode size={14} />
                    </Button>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ImagePlaceholder name={detail.name ?? 'PR'} />
              <div>
                <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>
                  {detail.name}
                </h2>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    margin: 0,
                    fontSize: '0.85rem',
                  }}
                >
                  {detail.sku && `SKU: ${detail.sku}`}
                  {detail.sku && detail.barcode && ' · '}
                  {detail.barcode && `Barcode: ${detail.barcode}`}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="ghost" onClick={() => setQrProduct(detail)}>
                <QrCode size={14} /> QR
              </Button>
              {ctx.permissions.includes('product.create') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    openEdit(detail);
                    setDetail(null);
                  }}
                >
                  <Edit size={14} /> Edit
                </Button>
              )}
              <Button variant="ghost" onClick={() => setDetail(null)}>
                Tutup
              </Button>
            </div>
          </div>
          <div className="product-detail-grid">
            <div className="product-detail-section">
              <h3 style={{ color: 'var(--text-primary)' }}>Informasi Produk</h3>
              <dl className="def-grid">
                <dt style={{ color: 'var(--text-secondary)' }}>SKU</dt>
                <dd>
                  <code>{detail.sku ?? '—'}</code>
                </dd>
                <dt style={{ color: 'var(--text-secondary)' }}>Barcode</dt>
                <dd>
                  <code>{detail.barcode ?? '—'}</code>
                </dd>
                <dt style={{ color: 'var(--text-secondary)' }}>Kategori</dt>
                <dd style={{ color: 'var(--text-secondary)' }}>
                  {detail.category?.name ?? '—'}
                </dd>
                <dt style={{ color: 'var(--text-secondary)' }}>Status</dt>
                <dd>
                  <StatusBadge status={detail.status ?? 'ACTIVE'} />
                </dd>
                <dt style={{ color: 'var(--text-secondary)' }}>Deskripsi</dt>
                <dd style={{ color: 'var(--text-secondary)' }}>
                  {detail.description || '—'}
                </dd>
              </dl>
            </div>
            <div className="product-detail-section">
              <h3 style={{ color: 'var(--text-primary)' }}>Harga & Nilai</h3>
              <dl className="def-grid">
                <dt style={{ color: 'var(--text-secondary)' }}>Harga Beli</dt>
                <dd style={{ color: 'var(--text-secondary)' }}>
                  {fmtRp(Number(detail.costPrice ?? detail.cost_price ?? 0))}
                </dd>
                <dt style={{ color: 'var(--text-secondary)' }}>Harga Jual</dt>
                <dd style={{ color: 'var(--text-primary)' }}>
                  <b>
                    {fmtRp(
                      Number(detail.sellingPrice ?? detail.selling_price ?? 0),
                    )}
                  </b>
                </dd>
                <dt style={{ color: 'var(--text-secondary)' }}>Margin</dt>
                <dd style={{ color: 'var(--color-success, #22c55e)' }}>
                  {(detail.sellingPrice ?? detail.selling_price ?? 0) > 0 &&
                  (detail.costPrice ?? detail.cost_price ?? 0) > 0
                    ? `${Math.round(((Number(detail.sellingPrice ?? detail.selling_price) - Number(detail.costPrice ?? detail.cost_price)) / Number(detail.costPrice ?? detail.cost_price)) * 100)}%`
                    : '—'}
                </dd>
                <dt style={{ color: 'var(--text-secondary)' }}>Nilai Stok</dt>
                <dd style={{ color: 'var(--text-primary)' }}>
                  {fmtRp(
                    (detail.stock ?? 0) *
                      Number(detail.costPrice ?? detail.cost_price ?? 0),
                  )}
                </dd>
              </dl>
            </div>
            <div className="product-detail-section">
              <h3 style={{ color: 'var(--text-primary)' }}>Stok</h3>
              <dl className="def-grid">
                <dt style={{ color: 'var(--text-secondary)' }}>
                  Stok Saat Ini
                </dt>
                <dd style={{ color: 'var(--text-primary)' }}>
                  {detail.stock ?? 0}
                </dd>
                <dt style={{ color: 'var(--text-secondary)' }}>Minimum Stok</dt>
                <dd style={{ color: 'var(--text-secondary)' }}>
                  {detail.minimumStock ?? 0}
                </dd>
                <dt style={{ color: 'var(--text-secondary)' }}>Riwayat Stok</dt>
                <dd>
                  <StockMiniChart
                    stock={detail.stock ?? 0}
                    minimum={detail.minimumStock ?? 0}
                  />
                </dd>
                <dt style={{ color: 'var(--text-secondary)' }}>Kondisi</dt>
                <dd>
                  {(detail.stock ?? 0) <= 0 ? (
                    <span style={{ color: 'var(--color-danger, #ef4444)' }}>
                      Habis
                    </span>
                  ) : (detail.stock ?? 0) <= (detail.minimumStock ?? 0) ? (
                    <span style={{ color: 'var(--color-warning, #f59e0b)' }}>
                      Rendah
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-success, #22c55e)' }}>
                      Aman
                    </span>
                  )}
                </dd>
              </dl>
            </div>
          </div>
          {detail.created_at && (
            <p
              style={{
                color: 'var(--text-muted)',
                marginTop: '1rem',
                fontSize: '0.85rem',
              }}
            >
              Dibuat: {new Date(detail.created_at).toLocaleString('id-ID')}
              {detail.updated_at &&
                ` · Diperbarui: ${new Date(detail.updated_at).toLocaleString('id-ID')}`}
            </p>
          )}
        </section>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tambah Produk"
        footer={
          <Button type="submit" form="product-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="product-form" className="inline-form" onSubmit={create}>
          <Field label="Nama Produk">
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
              placeholder="Auto-generate jika kosong"
            />
          </Field>
          <Field label="Barcode">
            <Input
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
          </Field>
          <Field label="Deskripsi">
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <Field label="Kategori">
            <Select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">— Pilih —</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Harga Beli (Cost)">
            <Input
              type="number"
              min="0"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            />
          </Field>
          <Field label="Harga Jual">
            <Input
              type="number"
              min="0"
              value={form.sellingPrice}
              onChange={(e) =>
                setForm({ ...form, sellingPrice: e.target.value })
              }
            />
          </Field>
          <Field label="Minimum Stok">
            <Input
              type="number"
              min="0"
              value={form.minimumStock}
              onChange={(e) =>
                setForm({ ...form, minimumStock: e.target.value })
              }
            />
          </Field>
          {msg && <p style={{ color: 'var(--text-muted)' }}>{msg}</p>}
        </form>
      </Modal>

      <Modal
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        title={`Edit — ${editProduct?.name ?? ''}`}
        footer={
          <Button type="submit" form="product-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="product-form" className="inline-form" onSubmit={update}>
          <Field label="Nama Produk">
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
          <Field label="Deskripsi">
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <Field label="Kategori">
            <Select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">— Pilih —</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Harga Beli (Cost)">
            <Input
              type="number"
              min="0"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            />
          </Field>
          <Field label="Harga Jual">
            <Input
              type="number"
              min="0"
              value={form.sellingPrice}
              onChange={(e) =>
                setForm({ ...form, sellingPrice: e.target.value })
              }
            />
          </Field>
          <Field label="Minimum Stok">
            <Input
              type="number"
              min="0"
              value={form.minimumStock}
              onChange={(e) =>
                setForm({ ...form, minimumStock: e.target.value })
              }
            />
          </Field>
          {msg && <p style={{ color: 'var(--text-muted)' }}>{msg}</p>}
        </form>
      </Modal>

      <Modal
        open={!!qrProduct}
        onClose={() => setQrProduct(null)}
        title={`QR Code — ${qrProduct?.name ?? ''}`}
        footer={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="ghost" onClick={handlePrintQr}>
              <Printer size={14} /> Cetak
            </Button>
            <Button variant="ghost" onClick={() => setQrProduct(null)}>
              Tutup
            </Button>
          </div>
        }
      >
        {qrProduct && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 0',
            }}
          >
            <div
              style={{
                background: '#fff',
                padding: '1rem',
                borderRadius: 8,
                border: '1px solid var(--border, #e5e7eb)',
              }}
            >
              <QrCodeDisplay
                value={qrProduct.barcode ?? qrProduct.sku ?? qrProduct.id}
                size={200}
              />
            </div>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              {qrProduct.name}
            </p>
            <code
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                background: 'var(--bg-secondary, #f3f4f6)',
                padding: '0.25rem 0.75rem',
                borderRadius: 4,
              }}
            >
              {qrProduct.barcode ?? qrProduct.sku ?? qrProduct.id}
            </code>
          </div>
        )}
      </Modal>

      <Modal
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        title="Import Produk"
        footer={<Button onClick={() => setShowBulkImport(false)}>Tutup</Button>}
      >
        <div style={{ padding: '1rem 0', textAlign: 'center' }}>
          <Upload
            size={48}
            style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}
          />
          <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            Upload CSV / Excel
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Format: Nama, SKU, Barcode, Harga Beli, Harga Jual, Stok, Kategori
          </p>
          <div
            style={{
              marginTop: '1rem',
              padding: '2rem',
              border: '2px dashed var(--border, #d1d5db)',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            Klik atau seret file ke sini
          </div>
        </div>
      </Modal>
    </>
  );
}

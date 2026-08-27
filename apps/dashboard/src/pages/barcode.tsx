import { FormEvent, useState, useCallback } from 'react';
import { ApiError, api } from '../api';
import { Button, EmptyState, ErrorState, Field, Input, LoadingState, StatusBadge, useTranslation } from '@niagantara/ui';
import { ScanLine, CheckSquare, Square, Printer, Search, Clock, Package } from 'lucide-react';

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
};

type ScanEntry = {
  code: string;
  timestamp: number;
  result?: Product;
  error?: boolean;
};

function CssBarcode({ value, height = 50 }: { value: string; height?: number }) {
  const seed = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 49297;
    return x - Math.floor(x);
  };
  const bars: number[] = [];
  for (let i = 0; i < Math.max(20, value.length * 5 + 10); i++) {
    bars.push(rng(i) > 0.4 ? 2 : rng(i) > 0.2 ? 1 : 3);
  }
  return (
    <div style={{ display: 'flex', alignItems: 'end', gap: 0, height: height + 8, padding: '4px 0' }}>
      {bars.map((w, i) => (
        <div
          key={i}
          style={{
            width: w,
            height: i % 2 === 0 ? height : height - 6,
            backgroundColor: i % 2 === 0 ? 'var(--text-primary)' : 'transparent',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

function BarcodeLabel({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div
      className="barcode-label"
      style={{
        border: '1px solid var(--border, #d1d5db)',
        borderRadius: 8,
        padding: compact ? '0.5rem' : '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        background: '#fff',
        breakInside: 'avoid',
      }}
    >
      <CssBarcode value={product.barcode ?? product.sku ?? product.id} height={compact ? 36 : 50} />
      <span style={{ fontSize: compact ? '0.6rem' : '0.75rem', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'center' }}>
        {product.name}
      </span>
      <code style={{ fontSize: compact ? '0.55rem' : '0.7rem', color: 'var(--text-muted)' }}>
        {product.barcode ?? product.sku ?? '—'}
      </code>
      {!compact && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary, #3b82f6)', fontWeight: 700 }}>
          Rp {Number(product.sellingPrice ?? product.selling_price ?? 0).toLocaleString('id-ID')}
        </span>
      )}
    </div>
  );
}

export function BarcodePage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: { permissions: string[] };
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanEntry[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);


  async function lookup(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api(
        `/barcodes/lookup?code=${encodeURIComponent(code)}`,
        token,
        company,
      );
      setResult(res);
      setScanHistory((prev) => [{ code, timestamp: Date.now(), result: (res as any)?.product }, ...prev].slice(0, 50));
    } catch (e) {
      setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'Barcode tidak ditemukan.');
      setScanHistory((prev) => [{ code, timestamp: Date.now(), error: true }, ...prev].slice(0, 50));
    } finally {
      setLoading(false);
    }
  }

  async function loadAllProducts() {
    if (productsLoaded) return;
    try {
      const p = await api<Product[]>('/products', token, company);
      setAllProducts(p);
      setProductsLoaded(true);
      setShowBatch(true);
    } catch {
      setError('Gagal memuat produk.');
    }
  }

  function toggleProduct(id: string) {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedProducts.size === allProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(allProducts.map((p) => p.id)));
    }
  }

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const selectedList = allProducts.filter((p) => selectedProducts.has(p.id));
  const fmtRp = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2 style={{ color: 'var(--text-primary)' }}>{t('pages.barcode')}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {ctx.permissions.includes('barcode.generate') && (
              <Button variant="ghost" onClick={loadAllProducts}>
                <Package size={14} /> Batch Generate
              </Button>
            )}
            <Button variant="ghost" onClick={() => setShowHistory(!showHistory)}>
              <Clock size={14} /> Riwayat
            </Button>
          </div>
        </div>
        <form className="search" onSubmit={lookup}>
          <Input
            placeholder="Masukkan atau scan barcode..."
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? '...' : <><Search size={14} /> {t('common.search')}</>}
          </Button>
        </form>
      </section>

      {showHistory && scanHistory.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h2 style={{ color: 'var(--text-primary)' }}>Riwayat Scan</h2>
            <span style={{ color: 'var(--text-muted)' }}>{scanHistory.length} scan</span>
          </div>
          <div className="table">
            <div className="tr head">
              {['Kode', 'Waktu', 'Status'].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {scanHistory.map((entry, i) => (
              <div className="tr" key={i}>
                <span><code>{entry.code}</code></span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {new Date(entry.timestamp).toLocaleTimeString('id-ID')}
                </span>
                <span>
                  {entry.error ? (
                    <span style={{ color: 'var(--color-danger, #ef4444)' }}>Tidak ditemukan</span>
                  ) : (
                    <span style={{ color: 'var(--color-success, #22c55e)' }}>Ditemukan</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading && <LoadingState label={t('common.loading')} />}

      {error && !loading && (
        <ErrorState message={error} onRetry={() => lookup({ preventDefault: () => {} } as FormEvent)} />
      )}

      {result?.product && (
        <section className="panel">
          <div className="panel-head">
            <h2 style={{ color: 'var(--text-primary)' }}>Hasil Pencarian</h2>
            <BarcodeLabel product={result.product} compact />
          </div>
          <dl className="def-grid">
            <dt style={{ color: 'var(--text-secondary)' }}>Nama Produk</dt>
            <dd style={{ color: 'var(--text-primary)' }}>{result.product.name ?? '—'}</dd>
            <dt style={{ color: 'var(--text-secondary)' }}>SKU</dt>
            <dd><code>{result.product.sku ?? '—'}</code></dd>
            <dt style={{ color: 'var(--text-secondary)' }}>Barcode</dt>
            <dd><code>{result.product.barcode ?? '—'}</code></dd>
            <dt style={{ color: 'var(--text-secondary)' }}>Harga Jual</dt>
            <dd style={{ color: 'var(--color-primary, #3b82f6)', fontWeight: 700 }}>{fmtRp(Number(result.product.sellingPrice ?? result.product.selling_price ?? 0))}</dd>
            <dt style={{ color: 'var(--text-secondary)' }}>Harga Modal</dt>
            <dd style={{ color: 'var(--text-secondary)' }}>{fmtRp(Number(result.product.costPrice ?? result.product.cost_price ?? 0))}</dd>
            <dt style={{ color: 'var(--text-secondary)' }}>Stok</dt>
            <dd>
              <span style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: '0.85rem',
                fontWeight: 600,
                background: (result.product.stock ?? 0) <= 0 ? 'rgba(239,68,68,0.1)' : (result.product.stock ?? 0) <= (result.product.minimumStock ?? 0) ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
                color: (result.product.stock ?? 0) <= 0 ? 'var(--color-danger, #ef4444)' : (result.product.stock ?? 0) <= (result.product.minimumStock ?? 0) ? 'var(--color-warning, #f59e0b)' : 'var(--color-success, #22c55e)',
              }}>
                {result.product.stock ?? '—'}
              </span>
            </dd>
            <dt style={{ color: 'var(--text-secondary)' }}>Minimum Stok</dt>
            <dd style={{ color: 'var(--text-secondary)' }}>{result.product.minimumStock ?? 0}</dd>
            <dt style={{ color: 'var(--text-secondary)' }}>Kategori</dt>
            <dd style={{ color: 'var(--text-secondary)' }}>{result.product.category?.name ?? '—'}</dd>
            <dt style={{ color: 'var(--text-secondary)' }}>Status</dt>
            <dd>
              <StatusBadge status={result.product.status ?? 'ACTIVE'} />
            </dd>
          </dl>
        </section>
      )}

      {!result && !error && !loading && (
        <EmptyState
          icon={<ScanLine size={28} />}
          title="Cari Produk dengan Barcode"
          description="Masukkan atau scan barcode untuk mencari produk dalam database."
        />
      )}

      {showBatch && (
        <section className="panel">
          <div className="panel-head">
            <h2 style={{ color: 'var(--text-primary)' }}>Batch Barcode Generation</h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {selectedProducts.size} / {allProducts.length} dipilih
              </span>
              <Button variant="ghost" onClick={selectAll}>
                {selectedProducts.size === allProducts.length ? 'Batal Pilih' : 'Pilih Semua'}
              </Button>
              {selectedProducts.size > 0 && (
                <Button variant="ghost" onClick={handlePrint}>
                  <Printer size={14} /> Cetak ({selectedProducts.size})
                </Button>
              )}
            </div>
          </div>
          <div className="table">
            <div className="tr head">
              {['', 'Produk', 'SKU', 'Barcode', 'Aksi'].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {allProducts.map((p) => (
              <div className="tr" key={p.id}>
                <span>
                  <button
                    onClick={() => toggleProduct(p.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                  >
                    {selectedProducts.has(p.id) ? (
                      <CheckSquare size={16} style={{ color: 'var(--color-primary, #3b82f6)' }} />
                    ) : (
                      <Square size={16} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>
                </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</span>
                <span><code>{p.sku ?? '—'}</code></span>
                <span><code>{p.barcode ?? '—'}</code></span>
                <span>
                  <Button variant="ghost" onClick={() => toggleProduct(p.id)}>
                    {selectedProducts.has(p.id) ? 'Hapus' : 'Pilih'}
                  </Button>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedList.length > 0 && (
        <section className="panel print-area">
          <div className="panel-head" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            <h2 style={{ color: 'var(--text-primary)' }}>Label Barcode ({selectedList.length})</h2>
            <Button variant="ghost" onClick={handlePrint}>
              <Printer size={14} /> Cetak Semua
            </Button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '0.75rem',
              padding: '0.5rem 0',
            }}
          >
            {selectedList.map((p) => (
              <BarcodeLabel key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {ctx.permissions.includes('barcode.generate') && !showBatch && (
        <section className="panel">
          <div className="panel-head">
            <h2 style={{ color: 'var(--text-primary)' }}>Generate Barcode</h2>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>
            Klik "Batch Generate" untuk memilih produk dan mencetak barcode label secara massal.
          </p>
        </section>
      )}
    </>
  );
}

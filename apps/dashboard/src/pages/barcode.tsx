import { FormEvent, useState } from 'react';
import { ApiError, api } from '../api';
import { Button, EmptyState, ErrorState, Field, Input, LoadingState, StatusBadge, useTranslation } from '@niagantara/ui';
import { ScanLine } from 'lucide-react';

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

  async function lookup(e: FormEvent) {
    e.preventDefault();
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
    } catch (e) {
      setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'Barcode tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  }

  const fmtRp = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;

  return (
    <>
      <section className="panel">
        <h2>{t('pages.barcode')}</h2>
        <form className="search" onSubmit={lookup}>
          <Input
            placeholder="Masukkan atau scan barcode..."
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? '...' : t('common.search')}
          </Button>
        </form>
      </section>

      {loading && <LoadingState label={t('common.loading')} />}
      
      {error && !loading && (
        <ErrorState message={error} onRetry={() => lookup({ preventDefault: () => {} } as FormEvent)} />
      )}

      {result?.product && (
        <section className="panel">
          <h2>Hasil Pencarian</h2>
          <dl className="def-grid">
            <dt>Nama Produk</dt>
            <dd>{result.product.name ?? '—'}</dd>
            <dt>SKU</dt>
            <dd>{result.product.sku ?? '—'}</dd>
            <dt>Barcode</dt>
            <dd>{result.product.barcode ?? '—'}</dd>
            <dt>Harga Jual</dt>
            <dd>{fmtRp(Number(result.product.sellingPrice ?? result.product.selling_price ?? 0))}</dd>
            <dt>Harga Modal</dt>
            <dd>{fmtRp(Number(result.product.costPrice ?? result.product.cost_price ?? 0))}</dd>
            <dt>Stok</dt>
            <dd>{result.product.stock ?? '—'}</dd>
            <dt>Minimum Stok</dt>
            <dd>{result.product.minimumStock ?? 0}</dd>
            <dt>Kategori</dt>
            <dd>{result.product.category?.name ?? '—'}</dd>
            <dt>Status</dt>
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

      {ctx.permissions.includes('barcode.generate') && (
        <section className="panel">
          <h2>Generate Barcode</h2>
          <p className="muted">
            Gunakan halaman Produk untuk melihat atau mengedit barcode yang sudah ada.
            Barcode baru dapat di-generate otomatis saat membuat produk baru.
          </p>
        </section>
      )}
    </>
  );
}

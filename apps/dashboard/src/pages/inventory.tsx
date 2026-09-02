import { FormEvent, useEffect, useState, useMemo } from 'react';
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
  StatCard,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import { Boxes, Download, ArrowRightLeft, Search } from 'lucide-react';
import { TransferForm } from '../enhancements';

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

function StockLevelBar({
  quantity,
  minimum,
}: {
  quantity: number;
  minimum: number;
}) {
  const max = Math.max(quantity, minimum * 3, 10);
  const pct = Math.min((quantity / max) * 100, 100);
  const color =
    quantity <= 0
      ? 'var(--color-danger, #ef4444)'
      : quantity <= minimum
        ? 'var(--color-warning, #f59e0b)'
        : 'var(--color-success, #22c55e)';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        minWidth: 120,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          background: 'var(--bg-secondary, #f3f4f6)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.8rem',
          minWidth: 24,
          textAlign: 'right',
        }}
      >
        {quantity}
      </span>
    </div>
  );
}

export function InventoryPage({
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
  const [moves, setMoves] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [moveFilterType, setMoveFilterType] = useState('');
  const [moveFilterFrom, setMoveFilterFrom] = useState('');
  const [moveFilterTo, setMoveFilterTo] = useState('');
  const [form, setForm] = useState({
    branchId: ctx.accessible_branches[0]?.id ?? '',
    warehouseId: '',
    productId: '',
    quantityDelta: '',
    minimumStock: '0',
    reason: 'CORRECTION',
    notes: '',
  });

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api<any[]>(
        `/inventory?limit=100${branchFilter ? `&branchId=${encodeURIComponent(branchFilter)}` : ''}${categoryFilter ? `&categoryId=${encodeURIComponent(categoryFilter)}` : ''}${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''}`,
        token,
        company,
      ),
      api<any[]>(
        `/inventory/movements?limit=100${branchFilter ? `&branchId=${encodeURIComponent(branchFilter)}` : ''}`,
        token,
        company,
      ),
      api<any[]>('/warehouses', token, company).catch(() => []),
      api<any[]>('/categories?limit=100', token, company).catch(() => []),
      api<any[]>('/products?status=active&limit=100', token, company).catch(
        () => [],
      ),
    ])
      .then(([a, b, w, c, p]) => {
        setRows(a);
        setMoves(b);
        setWarehouses(w);
        setCategories(c);
        setProducts(p);
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
  }, [company, token, branchFilter, categoryFilter, statusFilter]);

  async function adjust(e: FormEvent) {
    e.preventDefault();
    setMsg(t('common.saving'));
    try {
      await api('/inventory/adjust', token, company, {
        method: 'POST',
        headers: { 'x-branch-id': form.branchId },
        body: JSON.stringify({
          ...form,
          quantityDelta: Number(form.quantityDelta),
          minimumStock: Number(form.minimumStock),
        }),
      });
      setMsg(t('messages.saveSuccess'));
      setShowAdjust(false);
      setForm({ ...form, productId: '', quantityDelta: '', notes: '' });
      load();
    } catch {
      setMsg(t('messages.saveError'));
    }
  }

  const totalSKU = rows.length;
  const totalStock = rows.reduce(
    (n: number, r: any) => n + Number(r.quantity ?? 0),
    0,
  );
  const lowStock = rows.filter(
    (r: any) =>
      Number(r.quantity) > 0 && Number(r.quantity) <= Number(r.minimum_stock),
  ).length;
  const outOfStock = rows.filter((r: any) => Number(r.quantity) <= 0).length;

  const filteredMoves = useMemo(() => {
    return moves.filter((m: any) => {
      if (moveFilterType && m.movement_type !== moveFilterType) return false;
      if (
        moveFilterFrom &&
        m.created_at &&
        new Date(m.created_at) < new Date(moveFilterFrom)
      )
        return false;
      if (
        moveFilterTo &&
        m.created_at &&
        new Date(m.created_at) > new Date(moveFilterTo + 'T23:59:59')
      )
        return false;
      return true;
    });
  }, [moves, moveFilterType, moveFilterFrom, moveFilterTo]);

  const { page, pageCount, setPage, slice } = usePaged(rows);

  const handleExport = () => {
    const data = rows.map((r: any) => ({
      product: r.product?.name ?? r.product_id,
      sku: r.product?.sku ?? '',
      location: r.warehouse?.name ?? r.branch?.name ?? '',
      quantity: r.quantity,
      minimum_stock: r.minimum_stock,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="metrics">
        <StatCard label="Total SKU" value={String(totalSKU)} />
        <StatCard label="Total Stok" value={String(totalStock)} />
        <StatCard
          label="Stok Rendah"
          value={String(lowStock)}
          tone={lowStock > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Stok Habis"
          value={String(outOfStock)}
          tone={outOfStock > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="ng-filterbar">
        <Field label={t('common.search')}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nama produk atau SKU"
          />
        </Field>
        <Button variant="ghost" onClick={load}>
          <Search size={14} /> Cari
        </Button>
        <Field label="Cabang">
          <Select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">Semua cabang berizin</option>
            {ctx.accessible_branches.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Kategori">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Semua kategori</option>
            {categories.map((category: any) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Semua</option>
            <option value="IN_STOCK">Aman</option>
            <option value="LOW_STOCK">Stok rendah</option>
            <option value="OUT_OF_STOCK">Stok habis</option>
          </Select>
        </Field>
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <Button variant="ghost" onClick={handleExport}>
            <Download size={14} /> Export
          </Button>
          {ctx.permissions.includes('inventory.adjust') && (
            <>
              <Button variant="ghost" onClick={() => setShowAdjust(true)}>
                <ArrowRightLeft size={14} /> Adjust
              </Button>
            </>
          )}
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.inventory')}</h2>
          <span>{rows.length} item</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Boxes size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada data inventori."
          />
        ) : (
          <div className="table">
            <div className="tr head">
              {[
                'Produk',
                'SKU',
                'Lokasi',
                'Tersedia',
                'Level',
                'Minimum',
                'Status',
                'Gerakan Terakhir',
              ].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {slice.map((r: any, i: number) => {
              const qty = Number(r.quantity);
              const min = Number(r.minimum_stock);
              return (
                <div className="tr" key={r.id ?? i}>
                  <span
                    style={{ color: 'var(--text-primary)', fontWeight: 500 }}
                  >
                    {r.product?.name ?? r.product_id ?? '—'}
                  </span>
                  <span>
                    <code>{r.product?.sku ?? '—'}</code>
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {r.warehouse?.name ?? r.branch?.name ?? '—'}
                  </span>
                  <span
                    style={{ color: 'var(--text-primary)', fontWeight: 600 }}
                  >
                    {qty}
                  </span>
                  <span>
                    <StockLevelBar quantity={qty} minimum={min} />
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{min}</span>
                  <span>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background:
                          qty <= 0
                            ? 'rgba(239,68,68,0.1)'
                            : qty <= min
                              ? 'rgba(245,158,11,0.1)'
                              : 'rgba(34,197,94,0.1)',
                        color:
                          qty <= 0
                            ? 'var(--color-danger, #ef4444)'
                            : qty <= min
                              ? 'var(--color-warning, #f59e0b)'
                              : 'var(--color-success, #22c55e)',
                      }}
                    >
                      {qty <= 0 ? 'HABIS' : qty <= min ? 'RENDAH' : 'AMAN'}
                    </span>
                  </span>
                  <span
                    style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}
                  >
                    {r.last_movement_at
                      ? new Date(r.last_movement_at).toLocaleDateString('id-ID')
                      : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </section>

      {ctx.permissions.includes('inventory.transfer') &&
        warehouses.length > 1 && (
          <TransferForm
            company={company}
            token={token}
            warehouses={warehouses}
            onDone={load}
          />
        )}

      <section className="panel">
        <div className="panel-head">
          <h2>{t('inventory.movementHistory')}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Select
              value={moveFilterType}
              onChange={(e) => setMoveFilterType(e.target.value)}
            >
              <option value="">Semua Tipe</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="TRANSFER">Transfer</option>
              <option value="SALE">Sale</option>
              <option value="PURCHASE">Purchase</option>
              <option value="RETURN">Return</option>
            </Select>
            <Input
              type="date"
              value={moveFilterFrom}
              onChange={(e) => setMoveFilterFrom(e.target.value)}
              style={{ maxWidth: 140 }}
            />
            <span style={{ color: 'var(--text-muted)' }}>—</span>
            <Input
              type="date"
              value={moveFilterTo}
              onChange={(e) => setMoveFilterTo(e.target.value)}
              style={{ maxWidth: 140 }}
            />
          </div>
        </div>
        {filteredMoves.length ? (
          <div className="table">
            <div className="tr head">
              {[
                'Tipe',
                'Produk',
                'Jumlah',
                'Alasan',
                'Aktor',
                'Cabang',
                'Referensi',
                'Tanggal',
              ].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {filteredMoves.slice(0, 50).map((m: any, i: number) => (
              <div className="tr" key={m.id ?? i}>
                <span>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background:
                        m.movement_type === 'SALE'
                          ? 'rgba(239,68,68,0.1)'
                          : m.movement_type === 'PURCHASE'
                            ? 'rgba(34,197,94,0.1)'
                            : 'rgba(59,130,246,0.1)',
                      color:
                        m.movement_type === 'SALE'
                          ? 'var(--color-danger, #ef4444)'
                          : m.movement_type === 'PURCHASE'
                            ? 'var(--color-success, #22c55e)'
                            : 'var(--color-primary, #3b82f6)',
                    }}
                  >
                    {m.movement_type ?? m.type ?? '—'}
                  </span>
                </span>
                <span>{m.product?.name ?? '—'}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {m.quantity}
                </span>
                <span
                  style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}
                >
                  {m.notes ?? '—'}
                </span>
                <span>{m.actor?.full_name ?? m.actor_user_id ?? '—'}</span>
                <span>{m.branch?.name ?? '—'}</span>
                <span>
                  {m.reference_type
                    ? `${m.reference_type} · ${m.reference_id ?? '—'}`
                    : '—'}
                </span>
                <span
                  style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}
                >
                  {m.created_at
                    ? new Date(m.created_at).toLocaleString('id-ID')
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={t('dashboard.noData')} />
        )}
      </section>

      <Modal
        open={showAdjust}
        onClose={() => setShowAdjust(false)}
        title={t('inventory.adjustment')}
        footer={
          <Button type="submit" form="adjust-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="adjust-form" className="inline-form" onSubmit={adjust}>
          <Field label="Branch">
            <Select
              required
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            >
              {ctx.accessible_branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Warehouse">
            <Select
              value={form.warehouseId}
              onChange={(e) =>
                setForm({ ...form, warehouseId: e.target.value })
              }
            >
              <option value="">—</option>
              {warehouses
                .filter((w: any) => w.branch_id === form.branchId)
                .map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Produk">
            <Select
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Pilih produk</option>
              {products.map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.sku}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('common.quantity')}>
            <Input
              type="number"
              required
              value={form.quantityDelta}
              onChange={(e) =>
                setForm({ ...form, quantityDelta: e.target.value })
              }
            />
          </Field>
          <Field label={t('inventory.minimumStock')}>
            <Input
              type="number"
              value={form.minimumStock}
              onChange={(e) =>
                setForm({ ...form, minimumStock: e.target.value })
              }
            />
          </Field>
          <Field label="Alasan">
            <Select
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            >
              <option value="CORRECTION">Koreksi stok</option>
              <option value="DAMAGED">Barang rusak</option>
              <option value="EXPIRED">Barang kedaluwarsa</option>
              <option value="LOST">Barang hilang</option>
              <option value="MANUAL_CORRECTION">Koreksi manual</option>
              <option value="OTHER">Lainnya</option>
            </Select>
          </Field>
          <Field label="Catatan">
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          {msg && <p style={{ color: 'var(--text-muted)' }}>{msg}</p>}
        </form>
      </Modal>
    </>
  );
}

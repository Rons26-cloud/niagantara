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
  StatCard,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import { Boxes } from 'lucide-react';
import { TransferForm } from '../enhancements';

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

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
  const [filterStore, setFilterStore] = useState('');

  const branch = ctx.accessible_branches[0];
  const store = ctx.stores.find((x: any) => x.id === branch?.store_id);

  const [form, setForm] = useState({
    branchId: ctx.accessible_branches[0]?.id ?? '',
    warehouseId: '',
    productId: '',
    quantityDelta: '',
    minimumStock: '0',
    movementType: 'ADJUSTMENT',
  });

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api<any[]>('/inventory', token, company),
      api<any[]>('/inventory/movements', token, company),
      api<any[]>('/warehouses', token, company).catch(() => []),
    ])
      .then(([a, b, w]) => {
        setRows(a);
        setMoves(b);
        setWarehouses(w);
      })
      .catch((e) => setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token]);

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
      load();
    } catch {
      setMsg(t('messages.saveError'));
    }
  }

  const totalSKU = rows.length;
  const totalStock = rows.reduce((n: number, r: any) => n + Number(r.quantity ?? 0), 0);
  const lowStock = rows.filter((r: any) => Number(r.quantity) > 0 && Number(r.quantity) <= Number(r.minimum_stock)).length;
  const outOfStock = rows.filter((r: any) => Number(r.quantity) <= 0).length;

  const { page, pageCount, setPage, slice } = usePaged(rows);

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="metrics">
        <StatCard label="Total SKU" value={String(totalSKU)} />
        <StatCard label="Total Stok" value={String(totalStock)} />
        <StatCard label="Stok Rendah" value={String(lowStock)} tone={lowStock > 0 ? 'warning' : 'default'} />
        <StatCard label="Stok Habis" value={String(outOfStock)} tone={outOfStock > 0 ? 'danger' : 'default'} />
      </div>

      <div className="ng-filterbar">
        {ctx.stores.length > 1 && (
          <Field label={t('context.store')}>
            <Select value={filterStore} onChange={(e) => setFilterStore(e.target.value)}>
              <option value="">Semua</option>
              {ctx.stores.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
        )}
        {ctx.permissions.includes('inventory.adjust') && (
          <Button onClick={() => setShowAdjust(true)}>
            {t('inventory.adjustment')}
          </Button>
        )}
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
              {['Produk', 'SKU', 'Lokasi', 'Tersedia', 'Minimum', 'Status', 'Gerakan Terakhir'].map(
                (k) => (
                  <span key={k}>{k}</span>
                ),
              )}
            </div>
            {slice.map((r: any, i: number) => (
              <div className="tr" key={r.id ?? i}>
                <span>{r.product?.name ?? r.product_id ?? '—'}</span>
                <span>{r.product?.sku ?? '—'}</span>
                <span>{r.warehouse?.name ?? r.branch?.name ?? '—'}</span>
                <span>{r.quantity}</span>
                <span>{r.minimum_stock}</span>
                <span>
                  {Number(r.quantity) <= 0
                    ? 'HABIS'
                    : Number(r.quantity) <= Number(r.minimum_stock)
                      ? 'RENDAH'
                      : 'AMAN'}
                </span>
                <span>
                  {r.last_movement_at
                    ? new Date(r.last_movement_at).toLocaleDateString('id-ID')
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </section>

      {ctx.permissions.includes('inventory.transfer') && warehouses.length > 1 && (
        <TransferForm
          company={company}
          token={token}
          warehouses={warehouses}
          onDone={load}
        />
      )}

      <section className="panel">
        <h2>{t('inventory.movementHistory')}</h2>
        {moves.length ? (
          <div className="table">
            <div className="tr head">
              {['Tipe', 'Jumlah', 'Tanggal'].map((k) => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {moves.slice(0, 20).map((m: any, i: number) => (
              <div className="tr" key={m.id ?? i}>
                <span>{m.movement_type ?? m.type ?? '—'}</span>
                <span>{m.quantity}</span>
                <span>
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
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Warehouse">
            <Select
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
            >
              <option value="">—</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Product ID">
            <Input
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            />
          </Field>
          <Field label={t('common.quantity')}>
            <Input
              type="number"
              required
              value={form.quantityDelta}
              onChange={(e) => setForm({ ...form, quantityDelta: e.target.value })}
            />
          </Field>
          <Field label={t('inventory.minimumStock')}>
            <Input
              type="number"
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

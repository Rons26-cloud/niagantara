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
  StatusBadge,
  usePaged,
  useTranslation,
} from '@niagantara/ui';
import { ShoppingBag, Plus, Search } from 'lucide-react';

type Ctx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

export function PurchasesPage({
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
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [branchId, setBranchId] = useState('');

  const branch = ctx.accessible_branches[0];
  const store = ctx.stores.find((x: any) => x.id === branch?.store_id);
  const [form, setForm] = useState({
    supplierId: '',
    warehouseId: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    discount: '0',
    tax: '0',
    notes: '',
  });
  const [lines, setLines] = useState([{ productId: '', quantity: '1', unitCost: '0' }]);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api<any[]>(`/purchases?limit=100${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''}${status ? `&status=${status}` : ''}${branchId ? `&branchId=${branchId}` : ''}`, token, company),
      api<any[]>('/suppliers?status=active&limit=100', token, company),
      api<any[]>('/warehouses', token, company),
      api<any[]>('/products?status=active&limit=100', token, company),
    ])
      .then(([p, s, w, products]) => { setRows(p); setSuppliers(s); setWarehouses(w); setProducts(products); })
      .catch((e) => setError(e instanceof ApiError ? `${e.status} · ${e.code}` : 'network error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [company, token, status, branchId]);

  async function open(r: any) {
    try {
      setDetail(await api('/purchases/' + r.id, token, company));
    } catch {
      setDetail(r);
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!branch || !store) return;
    setMsg(t('common.saving'));
    try {
      await api('/purchases', token, company, {
        method: 'POST',
        headers: { 'x-branch-id': branch.id },
        body: JSON.stringify({
          storeId: store.id,
          branchId: branch.id,
          warehouseId: form.warehouseId,
          supplierId: form.supplierId,
          purchaseDate: form.purchaseDate,
          discount: Number(form.discount),
          tax: Number(form.tax),
          notes: form.notes || undefined,
          items: lines.map((line) => ({ productId: line.productId, quantity: Number(line.quantity), unitCost: Number(line.unitCost) })),
        }),
      });
      setMsg(t('messages.saveSuccess'));
      setShowCreate(false);
      setLines([{ productId: '', quantity: '1', unitCost: '0' }]);
      load();
    } catch (e) {
      setMsg(
        e instanceof ApiError && e.status === 403
          ? '403 · permission denied'
          : t('messages.saveError'),
      );
    }
  }

  async function receive() {
    if (!detail) return;
    const items = detail.items?.filter((x: any) => Number(x.received_quantity) < Number(x.quantity)).map((item: any) => ({ purchaseItemId: item.id, quantity: Number(item.quantity) - Number(item.received_quantity) }));
    if (!items?.length) return;
    try {
      await api('/purchases/' + detail.id + '/receive', token, company, {
        method: 'POST',
        headers: { 'x-branch-id': detail.branch_id },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          items,
        }),
      });
      setMsg('Stok berhasil diperbarui.');
      open(detail);
      load();
    } catch {
      setMsg(t('messages.saveError'));
    }
  }

  async function cancel() {
    if (!detail || !confirm('Batalkan pembelian ini?')) return;
    try {
      await api('/purchases/' + detail.id + '/cancel', token, company, { method: 'POST', headers: { 'x-branch-id': detail.branch_id }, body: JSON.stringify({ reason: 'Cancelled by authorized user' }) });
      setMsg('Pembelian dibatalkan.');
      setDetail(null);
      load();
    } catch (e) { setMsg(e instanceof ApiError ? `${e.status} · ${e.code}` : t('messages.saveError')); }
  }

  const fmtRp = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`;
  const { page, pageCount, setPage, slice } = usePaged(rows);

  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="metrics">
        <StatCard label="Total Pembelian" value={String(rows.length)} />
        <StatCard label="Menunggu Penerimaan" value={String(rows.filter((row) => ['ORDERED', 'PARTIALLY_RECEIVED'].includes(row.status)).length)} />
        <StatCard label="Diterima" value={String(rows.filter((row) => row.status === 'RECEIVED').length)} />
      </div>
      <div className="ng-filterbar">
        <Field label={t('common.search')}><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nomor pembelian" /></Field>
        <Button variant="ghost" onClick={load}><Search size={14} /> Cari</Button>
        <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Semua</option>{['DRAFT','ORDERED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED'].map((value) => <option key={value}>{value}</option>)}</Select></Field>
        <Field label="Cabang"><Select value={branchId} onChange={(e) => setBranchId(e.target.value)}><option value="">Semua cabang berizin</option>{ctx.accessible_branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>{t('pages.purchases')}</h2>
          {ctx.permissions.includes('purchase.create') && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={14} /> {t('common.create')} Pembelian
            </Button>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={28} />}
            title={t('dashboard.noData')}
            description="Belum ada pembelian. Klik tombol buat untuk membuat order baru."
          />
        ) : (
          <div className="sale-list">
            {slice.map((x: any) => (
              <button key={x.id} onClick={() => open(x)}>
                <b>{x.purchase_number ?? x.id}</b>
                <span>{x.supplier?.name ?? '—'} · {x.branch?.name ?? '—'} · {x.purchase_date ?? '—'}</span>
                <span>
                  <StatusBadge status={x.status ?? '—'} />
                </span>
                <strong>{fmtRp(Number(x.grand_total ?? 0))}</strong>
              </button>
            ))}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
        {msg && <p className="muted">{msg}</p>}
      </section>

      {detail && (
        <section className="panel">
          <div className="panel-head">
            <h2>{detail.purchase_number ?? detail.id}</h2>
            <Button variant="ghost" onClick={() => setDetail(null)}>
              {t('common.close')}
            </Button>
          </div>
          <dl className="def-grid">
            <dt>Status</dt>
            <dd>
              <StatusBadge status={detail.status ?? '—'} />
            </dd>
            <dt>Supplier</dt>
            <dd>{detail.supplier?.name ?? detail.supplierId ?? '—'}</dd>
            <dt>Total</dt>
            <dd>{fmtRp(Number(detail.grand_total ?? 0))}</dd>
            <dt>Subtotal</dt><dd>{fmtRp(Number(detail.subtotal ?? 0))}</dd>
            <dt>Diskon / Pajak</dt><dd>{fmtRp(Number(detail.discount ?? 0))} / {fmtRp(Number(detail.tax ?? 0))}</dd>
            <dt>Tanggal</dt><dd>{detail.purchase_date ?? '—'}</dd>
            <dt>Cabang / Gudang</dt><dd>{detail.branch?.name ?? detail.branch_id} / {detail.warehouse?.name ?? detail.warehouse_id}</dd>
            <dt>Catatan</dt><dd>{detail.notes ?? '—'}</dd>
          </dl>
          {detail.items?.length > 0 && (
            <div className="table" style={{ marginTop: 16 }}>
              <div className="tr head">
                {['Produk', 'Jumlah', 'Diterima', 'Harga Satuan'].map((k) => (
                  <span key={k}>{k}</span>
                ))}
              </div>
              {detail.items.map((item: any) => (
                <div className="tr" key={item.id}>
                  <span>{item.product?.name ?? item.productId ?? '—'}</span>
                  <span>{item.quantity}</span>
                  <span>{item.received_quantity ?? 0}</span>
                  <span>{fmtRp(Number(item.unit_cost ?? 0))}</span>
                </div>
              ))}
            </div>
          )}
          {ctx.permissions.includes('purchase.receive') && ['ORDERED', 'PARTIALLY_RECEIVED'].includes(detail.status) && (
            <Button onClick={receive} style={{ marginTop: 12 }}>
              Terima Sisa
            </Button>
          )}
          {ctx.permissions.includes('purchase.cancel') && ['DRAFT', 'ORDERED'].includes(detail.status) && <Button variant="ghost" onClick={cancel} style={{ marginTop: 12 }}>Batalkan</Button>}
        </section>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Buat Pembelian"
        footer={
          <Button type="submit" form="purchase-create-form">
            {t('common.save')}
          </Button>
        }
      >
        <form id="purchase-create-form" className="inline-form" onSubmit={create}>
          <Field label="Supplier">
            <Select
              required
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            ><option value="">Pilih supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</Select>
          </Field>
          <Field label="Gudang">
            <Select
              required
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
            ><option value="">Pilih gudang</option>{warehouses.filter((warehouse) => warehouse.branch_id === branch?.id).map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</Select>
          </Field>
          <Field label="Tanggal"><Input type="date" required value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></Field>
          {lines.map((line, index) => (
            <div key={index} className="purchase-line-editor">
              <Field label={`Produk ${index + 1}`}><Select required value={line.productId} onChange={(e) => setLines(lines.map((value, i) => i === index ? { ...value, productId: e.target.value } : value))}><option value="">Pilih produk</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}</Select></Field>
              <Field label={t('common.quantity')}><Input type="number" min="0.001" step="0.001" required value={line.quantity} onChange={(e) => setLines(lines.map((value, i) => i === index ? { ...value, quantity: e.target.value } : value))} /></Field>
              <Field label="Harga Satuan"><Input type="number" min="0" step="0.001" required value={line.unitCost} onChange={(e) => setLines(lines.map((value, i) => i === index ? { ...value, unitCost: e.target.value } : value))} /></Field>
              {lines.length > 1 && <Button type="button" variant="ghost" onClick={() => setLines(lines.filter((_, i) => i !== index))}>Hapus</Button>}
            </div>
          ))}
          <Button type="button" variant="ghost" onClick={() => setLines([...lines, { productId: '', quantity: '1', unitCost: '0' }])}>Tambah Item</Button>
          <Field label="Diskon"><Input type="number" min="0" step="0.001" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></Field>
          <Field label="Pajak"><Input type="number" min="0" step="0.001" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} /></Field>
          <Field label="Catatan"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          {msg && <p className="muted">{msg}</p>}
        </form>
      </Modal>
    </>
  );
}

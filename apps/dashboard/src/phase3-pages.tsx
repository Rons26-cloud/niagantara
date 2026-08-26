import { FormEvent, useEffect, useState } from 'react';
import { api } from './api';
export { PosPage, Receipt } from '@niagantara/pos-core';
import { Receipt } from '@niagantara/pos-core';
import type { PosCtx } from '@niagantara/pos-core';
import { Button, EmptyState, ErrorState, Input, LoadingState, useTranslation } from '@niagantara/ui';
import { Clock3, ReceiptText } from 'lucide-react';
type Ctx = PosCtx;

export function ShiftPage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const branch = ctx.accessible_branches[0],
    store = ctx.stores.find((x) => x.id === branch?.store_id);
  const [rows, setRows] = useState<any[]>([]), [cash, setCash] = useState('0'), [msg, setMsg] = useState(''), [loading, setLoading] = useState(true), [error, setError] = useState<string | null>(null);
  const load = () => { setLoading(true); setError(null); return api<any[]>('/shifts', token, company).then(setRows).catch(() => setError('Shift gagal dimuat.')).finally(() => setLoading(false)); };
  useEffect(() => {
    void load();
  }, [company, token]);
  const open = async () => {
    if (!branch || !store) return;
    try { await api('/shifts/open', token, company, {
      method: 'POST',
      headers: { 'x-branch-id': branch.id },
      body: JSON.stringify({
        storeId: store.id,
        branchId: branch.id,
        openingCash: Number(cash),
      }),
    }); setMsg('Shift berhasil dibuka.'); await load(); } catch { setMsg('Shift tidak dapat dibuka.'); }
  };
  const close = async (id: string) => {
    try { await api(`/shifts/${id}/close`, token, company, {
      method: 'POST',
      body: JSON.stringify({ closingCash: Number(cash) }),
    }); setMsg('Shift berhasil ditutup.'); await load(); } catch { setMsg('Shift tidak dapat ditutup.'); }
  };
  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  return (
    <>
      <section className="panel">
        <h2>Shift Kasir</h2>
        <Input
          type="number"
          min="0"
          value={cash}
          onChange={(e) => setCash(e.target.value)}
        />
        {ctx.permissions.includes('shift.open') && (
          <Button onClick={open}>Buka Shift</Button>
        )}
        {msg && <p className="muted" role="status">{msg}</p>}
      </section>
      <section className="panel">
        {rows.length === 0 ? <EmptyState icon={<Clock3 size={28} />} title="Belum ada shift" description="Buka shift untuk mulai operasional kasir." /> : rows.map((x) => (
          <div className="shift-row" key={x.id}>
            <span>
              {x.status} · {new Date(x.opened_at).toLocaleString('id-ID')}
            </span>
            <b>Opening Rp {Number(x.opening_cash).toLocaleString('id-ID')}</b>
            {x.status === 'OPEN' && ctx.permissions.includes('shift.close') && (
              <Button variant="secondary" onClick={() => close(x.id)}>Tutup Shift</Button>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
export function SalesPage({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<any[]>([]),
    [sale, setSale] = useState<any>(),
    [q, setQ] = useState(''),
    [status, setStatus] = useState(''),
    [payment, setPayment] = useState(''),
    [branch, setBranch] = useState(''),
    [cashier, setCashier] = useState(''),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''), [loading, setLoading] = useState(true), [error, setError] = useState<string | null>(null);
  const load = () => { setLoading(true); setError(null); return api<any[]>(
      `/sales?search=${encodeURIComponent(q)}&status=${status}&paymentMethod=${payment}&branchId=${branch}&cashierId=${cashier}&from=${from}&to=${to}`,
      token,
      company,
    ).then(setRows).catch(() => setError('Penjualan gagal dimuat.')).finally(() => setLoading(false)); };
  useEffect(() => {
    void load();
  }, [company, token]);
  const detail = async (id: string) =>
    setSale(await api(`/sales/${id}`, token, company));
  const cancel = async () => {
    const reason = prompt('Alasan pembatalan');
    if (reason && sale) {
      try { await api(`/sales/${sale.id}/cancel`, token, company, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }); setSale(undefined); await load(); } catch { setError('Transaksi tidak dapat dibatalkan.'); }
    }
  };
  const refund = async (partial = false) => {
    const reason = prompt('Alasan refund');
    if (reason && sale) {
      try { await api(`/sales/${sale.id}/refunds`, token, company, {
        method: 'POST',
        body: JSON.stringify({
          reason,
          items: (partial ? sale.items.slice(0, 1) : sale.items).map(
            (x: any) => ({
              saleItemId: x.id,
              quantity: partial
                ? Math.min(
                    Number(x.quantity),
                    Number(prompt('Quantity refund') ?? 0),
                  )
                : x.quantity,
              restock: true,
              condition: 'SELLABLE',
            }),
          ),
        }),
      }); await detail(sale.id); await load(); } catch { setError('Refund tidak dapat diproses.'); }
    }
  };
  if (loading) return <LoadingState label={t('common.loading')} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  return (
    <>
      <section className="panel">
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nomor transaksi"
          />
          <button>Cari</button>
        </form>
        <div className="sales-filters">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <select value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="Cabang">
            <option value="">Semua cabang</option>
            {ctx.accessible_branches.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <input
            value={cashier}
            onChange={(e) => setCashier(e.target.value)}
            placeholder="Cashier ID"
          />
          <select value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="">All payments</option>
            {['CASH', 'QRIS', 'BANK_TRANSFER', 'E_WALLET', 'OTHER'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {['PAID', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        </div>
        <div className="sale-list">
          {rows.length === 0 ? <EmptyState icon={<ReceiptText size={28} />} title="Belum ada penjualan" description="Ubah filter tanggal atau tunggu transaksi baru." /> : rows.map((x) => (
            <button key={x.id} onClick={() => detail(x.id)}>
              <b>{x.transaction_number}</b>
              <span>{new Date(x.created_at).toLocaleString('id-ID')}</span>
              <strong>
                Rp {Number(x.grand_total).toLocaleString('id-ID')}
              </strong>
              <small>{x.status}</small>
            </button>
          ))}
        </div>
      </section>
      {sale && (
        <section className="panel">
          <Receipt sale={sale} onClose={() => setSale(undefined)} />
          {ctx.permissions.includes('sale.cancel') &&
            sale.status === 'PAID' && (
              <button onClick={cancel}>Cancel sale</button>
            )}
          {ctx.permissions.includes('sale.refund') &&
            ['PAID', 'PARTIALLY_REFUNDED'].includes(sale.status) && (
              <>
                <button onClick={() => refund(false)}>
                  Full remaining refund + restock
                </button>
                <button onClick={() => refund(true)}>Partial refund</button>
              </>
            )}
        </section>
      )}
    </>
  );
}

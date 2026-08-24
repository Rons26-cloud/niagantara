import { FormEvent, useEffect, useState } from 'react';
import { api } from './api';
export { PosPage, Receipt } from '@niagantara/pos-core';
import { Receipt } from '@niagantara/pos-core';
import type { PosCtx } from '@niagantara/pos-core';
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
  const branch = ctx.accessible_branches[0],
    store = ctx.stores.find((x) => x.id === branch?.store_id);
  const [rows, setRows] = useState<any[]>([]),
    [cash, setCash] = useState('0'),
    [msg, setMsg] = useState('');
  const load = () =>
    api<any[]>('/shifts', token, company)
      .then(setRows)
      .catch(() => setMsg('Shift gagal dimuat.'));
  useEffect(() => {
    void load();
  }, [company, token]);
  const open = async () => {
    if (!branch || !store) return;
    await api('/shifts/open', token, company, {
      method: 'POST',
      headers: { 'x-branch-id': branch.id },
      body: JSON.stringify({
        storeId: store.id,
        branchId: branch.id,
        openingCash: Number(cash),
      }),
    });
    load();
  };
  const close = async (id: string) => {
    await api(`/shifts/${id}/close`, token, company, {
      method: 'POST',
      body: JSON.stringify({ closingCash: Number(cash) }),
    });
    load();
  };
  return (
    <>
      <section className="panel">
        <h2>Cashier Shift</h2>
        <input
          type="number"
          min="0"
          value={cash}
          onChange={(e) => setCash(e.target.value)}
        />
        {ctx.permissions.includes('shift.open') && (
          <button onClick={open}>Open shift</button>
        )}
        <p>{msg}</p>
      </section>
      <section className="panel">
        {rows.map((x) => (
          <div className="shift-row" key={x.id}>
            <span>
              {x.status} · {new Date(x.opened_at).toLocaleString('id-ID')}
            </span>
            <b>Opening Rp {Number(x.opening_cash).toLocaleString('id-ID')}</b>
            {x.status === 'OPEN' && ctx.permissions.includes('shift.close') && (
              <button onClick={() => close(x.id)}>Close shift</button>
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
  const [rows, setRows] = useState<any[]>([]),
    [sale, setSale] = useState<any>(),
    [q, setQ] = useState(''),
    [status, setStatus] = useState(''),
    [payment, setPayment] = useState(''),
    [branch, setBranch] = useState(''),
    [cashier, setCashier] = useState(''),
    [from, setFrom] = useState(''),
    [to, setTo] = useState('');
  const load = () =>
    api<any[]>(
      `/sales?search=${encodeURIComponent(q)}&status=${status}&paymentMethod=${payment}&branchId=${branch}&cashierId=${cashier}&from=${from}&to=${to}`,
      token,
      company,
    ).then(setRows);
  useEffect(() => {
    void load();
  }, [company, token]);
  const detail = async (id: string) =>
    setSale(await api(`/sales/${id}`, token, company));
  const cancel = async () => {
    const reason = prompt('Alasan pembatalan');
    if (reason && sale) {
      await api(`/sales/${sale.id}/cancel`, token, company, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      setSale(undefined);
      load();
    }
  };
  const refund = async (partial = false) => {
    const reason = prompt('Alasan refund');
    if (reason && sale) {
      await api(`/sales/${sale.id}/refunds`, token, company, {
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
      });
      detail(sale.id);
      load();
    }
  };
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
          <input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="Branch ID"
          />
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
          {rows.map((x) => (
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

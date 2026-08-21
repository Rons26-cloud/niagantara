import { FormEvent, useEffect, useState } from 'react';
import { api } from './api';
type Ctx = { permissions: string[]; stores: any[]; accessible_branches: any[] };
type Line = {
  id: string;
  name: string;
  sku: string;
  selling_price: number;
  quantity: number;
  available: number;
  discountType?: 'PERCENT' | 'FIXED';
  discountValue: number;
};
export function PosPage({
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
  const [warehouse, setWarehouse] = useState('');
  const [shift, setShift] = useState<any>();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<Line[]>([]);
  const [method, setMethod] = useState('CASH');
  const [received, setReceived] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [msg, setMsg] = useState('');
  const [receipt, setReceipt] = useState<any>();
  useEffect(() => {
    Promise.all([
      api<any[]>('/warehouses', token, company),
      api<any[]>('/shifts', token, company),
    ])
      .then(([w, s]) => {
        setWarehouse(w.find((x) => x.branch_id === branch?.id)?.id ?? '');
        setShift(
          s.find((x) => x.branch_id === branch?.id && x.status === 'OPEN'),
        );
      })
      .catch(() => setMsg('Konteks POS gagal dimuat.'));
  }, [company, token, branch?.id]);
  const search = async (e?: FormEvent) => {
    e?.preventDefault();
    if (branch && warehouse)
      setProducts(
        await api(
          `/pos/products?warehouseId=${warehouse}&search=${encodeURIComponent(q)}${category ? `&categoryId=${encodeURIComponent(category)}` : ''}`,
          token,
          company,
          { headers: { 'x-branch-id': branch.id } },
        ),
      );
  };
  const add = (p: any) =>
    setCart((old) => {
      const hit = old.find((x) => x.id === p.id);
      return hit
        ? old.map((x) =>
            x.id === p.id
              ? { ...x, quantity: Math.min(x.quantity + 1, x.available) }
              : x,
          )
        : [
            ...old,
            {
              id: p.id,
              name: p.name,
              sku: p.sku,
              selling_price: Number(p.selling_price),
              quantity: 1,
              available: Number(p.inventory?.quantity ?? 0),
              discountValue: 0,
            },
          ];
    });
  const scan = async () => {
    try {
      add(
        await api(
          `/pos/barcode?warehouseId=${warehouse}&code=${encodeURIComponent(q)}`,
          token,
          company,
          { headers: { 'x-branch-id': branch.id } },
        ),
      );
      setQ('');
    } catch {
      setMsg('PRODUCT_NOT_FOUND');
    }
  };
  const subtotal = cart.reduce((n, x) => n + x.selling_price * x.quantity, 0),
    itemDiscount = cart.reduce((n, x) => {
      const gross = x.selling_price * x.quantity;
      return (
        n +
        (x.discountType === 'PERCENT'
          ? (gross * Math.min(x.discountValue, 100)) / 100
          : x.discountType === 'FIXED'
            ? Math.min(gross, x.discountValue)
            : 0)
      );
    }, 0),
    disc = Math.min(subtotal - itemDiscount, Number(discount)),
    total = (subtotal - itemDiscount - disc) * (1 + Number(tax) / 100);
  const checkout = async () => {
    if (!branch || !store || !shift || !warehouse)
      return setMsg('Active shift required.');
    if (cart.some((x) => x.quantity > x.available))
      return setMsg('INSUFFICIENT_STOCK');
    try {
      const r = await api<{ saleId: string }>('/pos/checkout', token, company, {
        method: 'POST',
        headers: { 'x-branch-id': branch.id },
        body: JSON.stringify({
          storeId: store.id,
          branchId: branch.id,
          warehouseId: warehouse,
          shiftId: shift.id,
          idempotencyKey: crypto.randomUUID(),
          items: cart.map((x) => ({
            productId: x.id,
            quantity: x.quantity,
            discountType: x.discountType,
            discountValue: x.discountValue,
          })),
          transactionDiscountType: disc ? 'FIXED' : undefined,
          transactionDiscountValue: disc,
          taxRate: Number(tax),
          paymentMethod: method,
          amountReceived: Number(received || total),
        }),
      });
      setReceipt(await api(`/sales/${r.saleId}`, token, company));
      setCart([]);
      setMsg('PAID');
    } catch {
      setMsg('Checkout ditolak tanpa perubahan stok.');
    }
  };
  return (
    <div className="pos-grid">
      <Catalog
        q={q}
        setQ={setQ}
        category={category}
        setCategory={setCategory}
        search={search}
        scan={scan}
        products={products}
        add={add}
      />
      <Cart
        lines={cart}
        setLines={setCart}
        permissions={ctx.permissions}
        discount={discount}
        setDiscount={setDiscount}
        tax={tax}
        setTax={setTax}
        method={method}
        setMethod={setMethod}
        received={received}
        setReceived={setReceived}
        total={total}
        checkout={checkout}
        shift={shift}
        message={msg}
      />
      {receipt && (
        <Receipt sale={receipt} onClose={() => setReceipt(undefined)} />
      )}
    </div>
  );
}
function Catalog(p: any) {
  return (
    <section className="panel">
      <form className="search" onSubmit={p.search}>
        <input
          autoFocus
          value={p.q}
          onChange={(e) => p.setQ(e.target.value)}
          placeholder="Barcode, SKU, atau nama"
        />
        <button>Cari</button>
        <button type="button" onClick={p.scan}>
          Scan
        </button>
      </form>
      <input
        value={p.category}
        onChange={(e) => p.setCategory(e.target.value)}
        placeholder="Category ID filter (optional)"
      />
      <div className="product-grid">
        {p.products.map((x: any) => (
          <button
            className="product-card"
            key={x.id}
            disabled={!Number(x.inventory?.quantity)}
            onClick={() => p.add(x)}
          >
            <b>{x.name}</b>
            <span>{x.sku}</span>
            <small>Stock {x.inventory?.quantity ?? 0}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
function Cart(p: any) {
  return (
    <section className="panel cart">
      <h2>Cart</h2>
      {p.lines.map((x: Line) => (
        <div className="cart-line" key={x.id}>
          <b>{x.name}</b>
          <input
            type="number"
            min="1"
            max={x.available}
            value={x.quantity}
            onChange={(e) =>
              p.setLines(
                p.lines.map((y: Line) =>
                  y.id === x.id
                    ? { ...y, quantity: Number(e.target.value) }
                    : y,
                ),
              )
            }
          />
          {p.permissions.includes('pos.discount') && (
            <>
              <select
                value={x.discountType ?? ''}
                onChange={(e) =>
                  p.setLines(
                    p.lines.map((y: Line) =>
                      y.id === x.id
                        ? { ...y, discountType: e.target.value || undefined }
                        : y,
                    ),
                  )
                }
              >
                <option value="">No item discount</option>
                <option>PERCENT</option>
                <option>FIXED</option>
              </select>
              <input
                type="number"
                min="0"
                value={x.discountValue}
                onChange={(e) =>
                  p.setLines(
                    p.lines.map((y: Line) =>
                      y.id === x.id
                        ? { ...y, discountValue: Number(e.target.value) }
                        : y,
                    ),
                  )
                }
              />
            </>
          )}
          <button
            onClick={() =>
              p.setLines(p.lines.filter((y: Line) => y.id !== x.id))
            }
          >
            Remove
          </button>
        </div>
      ))}
      <button disabled={!p.lines.length} onClick={() => p.setLines([])}>
        Clear
      </button>
      {p.permissions.includes('pos.discount') && (
        <input
          type="number"
          min="0"
          value={p.discount}
          onChange={(e) => p.setDiscount(e.target.value)}
          placeholder="Discount"
        />
      )}
      <input
        type="number"
        min="0"
        max="100"
        value={p.tax}
        onChange={(e) => p.setTax(e.target.value)}
        placeholder="Tax %"
      />
      <strong>Total Rp {p.total.toLocaleString('id-ID')}</strong>
      <select value={p.method} onChange={(e) => p.setMethod(e.target.value)}>
        {['CASH', 'QRIS', 'BANK_TRANSFER', 'E_WALLET', 'OTHER'].map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      {p.method === 'CASH' && (
        <input
          type="number"
          min={p.total}
          value={p.received}
          onChange={(e) => p.setReceived(e.target.value)}
          placeholder="Amount received"
        />
      )}
      <button disabled={!p.lines.length || !p.shift} onClick={p.checkout}>
        Bayar
      </button>
      <p>{p.message}</p>
    </section>
  );
}
export function Receipt({ sale, onClose }: { sale: any; onClose: () => void }) {
  const payment = Array.isArray(sale.payment) ? sale.payment[0] : sale.payment;
  return (
    <article className="receipt-paper">
      <h2>NIAGANTARA</h2>
      <p>
        {sale.store?.name ?? 'Store'} · {sale.branch?.name ?? sale.branch_id}
      </p>
      <b>{sale.transaction_number}</b>
      <small>{new Date(sale.created_at).toLocaleString('id-ID')}</small>
      <hr />
      {sale.items?.map((x: any) => (
        <div key={x.id} className="receipt-line">
          <span>
            {x.product_name} × {x.quantity}
          </span>
          <b>Rp {Number(x.line_total).toLocaleString('id-ID')}</b>
        </div>
      ))}
      <hr />
      <p>Subtotal Rp {Number(sale.subtotal).toLocaleString('id-ID')}</p>
      <p>
        Discount Rp{' '}
        {(
          Number(sale.item_discount_total) + Number(sale.transaction_discount)
        ).toLocaleString('id-ID')}
      </p>
      <h3>Total Rp {Number(sale.grand_total).toLocaleString('id-ID')}</h3>
      <p>
        {payment?.method} · Received Rp{' '}
        {Number(payment?.amount_received ?? payment?.amount).toLocaleString(
          'id-ID',
        )}{' '}
        · Change Rp{' '}
        {Number(payment?.change_amount ?? 0).toLocaleString('id-ID')}
      </p>
      <div className="receipt-actions">
        <button onClick={() => window.print()}>Print</button>
        <button onClick={onClose}>Close</button>
      </div>
    </article>
  );
}
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

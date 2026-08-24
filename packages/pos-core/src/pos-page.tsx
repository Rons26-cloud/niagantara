import { FormEvent, useEffect, useState } from 'react';
import { api } from './api';

export type PosCtx = {
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};

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
  ctx: PosCtx;
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
    if (!branch) return;
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
      <section className="panel">
        <form className="search" onSubmit={search}>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Barcode, SKU, atau nama"
            aria-label="Cari produk"
          />
          <button>Cari</button>
          <button type="button" onClick={scan}>
            Scan
          </button>
        </form>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category ID filter (optional)"
          aria-label="Filter kategori"
        />
        <div className="product-grid">
          {products.map((x: any) => (
            <button
              className="product-card"
              key={x.id}
              disabled={!Number(x.inventory?.quantity)}
              onClick={() => add(x)}
            >
              <b>{x.name}</b>
              <span>{x.sku}</span>
              <em>Rp {Number(x.selling_price).toLocaleString('id-ID')}</em>
              <small>Stock {x.inventory?.quantity ?? 0}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="panel cart">
        <h2>Cart</h2>
        {cart.map((x) => (
          <div className="cart-line" key={x.id}>
            <b>{x.name}</b>
            <input
              type="number"
              min="1"
              max={x.available}
              value={x.quantity}
              aria-label={`Jumlah ${x.name}`}
              onChange={(e) =>
                setCart(
                  cart.map((y) =>
                    y.id === x.id ? { ...y, quantity: Number(e.target.value) } : y,
                  ),
                )
              }
            />
            {ctx.permissions.includes('pos.discount') && (
              <>
                <select
                  value={x.discountType ?? ''}
                  aria-label={`Diskon ${x.name}`}
                  onChange={(e) =>
                    setCart(
                      cart.map((y) =>
                        y.id === x.id
                          ? {
                              ...y,
                              discountType:
                                (e.target.value as Line['discountType']) ||
                                undefined,
                            }
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
                  aria-label={`Nilai diskon ${x.name}`}
                  onChange={(e) =>
                    setCart(
                      cart.map((y) =>
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
              onClick={() => setCart(cart.filter((y) => y.id !== x.id))}
              aria-label={`Hapus ${x.name}`}
            >
              Remove
            </button>
          </div>
        ))}
        <button disabled={!cart.length} onClick={() => setCart([])}>
          Clear
        </button>
        {ctx.permissions.includes('pos.discount') && (
          <input
            type="number"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="Discount"
            aria-label="Diskon transaksi"
          />
        )}
        <input
          type="number"
          min="0"
          max="100"
          value={tax}
          onChange={(e) => setTax(e.target.value)}
          placeholder="Tax %"
          aria-label="Pajak persen"
        />
        <strong>Total Rp {total.toLocaleString('id-ID')}</strong>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          aria-label="Metode pembayaran"
        >
          {['CASH', 'QRIS', 'BANK_TRANSFER', 'E_WALLET', 'OTHER'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        {method === 'CASH' && (
          <input
            type="number"
            min={total}
            value={received}
            onChange={(e) => setReceived(e.target.value)}
            placeholder="Amount received"
            aria-label="Uang diterima"
          />
        )}
        <button disabled={!cart.length || !shift} onClick={checkout}>
          Bayar
        </button>
        <p>{msg}</p>
      </section>
      <div className="pos-mobile-cta" aria-hidden={false}>
        <span>
          <b>{cart.reduce((n, x) => n + x.quantity, 0)}</b> item · Rp{' '}
          {total.toLocaleString('id-ID')}
          {!shift && <small> · Buka shift</small>}
        </span>
        <button disabled={!cart.length || !shift} onClick={checkout}>
          Bayar
        </button>
      </div>
      {receipt && <Receipt sale={receipt} onClose={() => setReceipt(undefined)} />}
    </div>
  );
}

export function Receipt({ sale, onClose }: { sale: any; onClose: () => void }) {
  const payment = Array.isArray(sale.payment) ? sale.payment[0] : sale.payment;
  return (
    <article className="receipt-paper">
      <img className="receipt-logo" src="/logo.png" alt="NIAGANTARA" />
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

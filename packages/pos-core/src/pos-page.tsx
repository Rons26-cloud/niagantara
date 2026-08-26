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
  note?: string;
};

type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
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
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<Line[]>([]);
  const [method, setMethod] = useState('CASH');
  const [received, setReceived] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [receipt, setReceipt] = useState<any>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  useEffect(() => {
    Promise.all([
      api<any[]>('/warehouses', token, company),
      api<any[]>('/shifts', token, company),
      api<any[]>('/categories', token, company).catch(() => []),
      api<any[]>('/customers', token, company).catch(() => []),
    ])
      .then(([w, s, cats, custs]) => {
        setWarehouse(w.find((x) => x.branch_id === branch?.id)?.id ?? '');
        setShift(s.find((x) => x.branch_id === branch?.id && x.status === 'OPEN'));
        setCategories(Array.isArray(cats) ? cats : []);
        setCustomers(Array.isArray(custs) ? custs : []);
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
  const changeAmount = method === 'CASH' ? Math.max(0, Number(received || 0) - total) : 0;
  const itemCount = cart.reduce((n, x) => n + x.quantity, 0);

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
          customerId: customer?.id,
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
          note: note || undefined,
        }),
      });
      setReceipt(await api(`/sales/${r.saleId}`, token, company));
      setCart([]);
      setNote('');
      setReceived('');
      setCustomer(null);
      setMsg('PAID');
    } catch {
      setMsg('Checkout ditolak tanpa perubahan stok.');
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      !customerSearch ||
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch),
  );

  return (
    <div className="pos-grid">
      <section className="panel pos-products-panel">
        <form className="search" onSubmit={search}>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Barcode, SKU, atau nama produk..."
            aria-label="Cari produk"
          />
          <button type="submit">Cari</button>
          <button type="button" onClick={scan}>Scan</button>
        </form>

        <div className="pos-category-filter">
          <button
            className={!category ? 'active' : ''}
            onClick={() => { setCategory(''); }}
          >
            Semua
          </button>
          {categories.map((c: any) => (
            <button
              key={c.id}
              className={category === c.id ? 'active' : ''}
              onClick={() => setCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {products.length === 0 ? (
            <div className="pos-empty-products">
              <p>Cari produk menggunakan barcode, SKU, atau nama.</p>
            </div>
          ) : (
            products.map((x: any) => (
              <button
                className="product-card"
                key={x.id}
                disabled={!Number(x.inventory?.quantity)}
                onClick={() => add(x)}
              >
                <b>{x.name}</b>
                <span className="product-card-sku">{x.sku}</span>
                <em className="product-card-price">
                  Rp {Number(x.selling_price).toLocaleString('id-ID')}
                </em>
                <small className={
                  Number(x.inventory?.quantity) <= 0 ? 'stock-out' :
                  Number(x.inventory?.quantity) <= 5 ? 'stock-low' : ''
                }>
                  Stok: {x.inventory?.quantity ?? 0}
                </small>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="panel cart pos-cart-panel">
        <div className="pos-cart-header">
          <h2>Keranjang ({itemCount})</h2>
          {shift && (
            <span className="pos-shift-badge">
              ● Shift Aktif — {shift.branch?.name ?? ''}
            </span>
          )}
        </div>

        {!shift && (
          <div className="pos-no-shift">
            <p>⚠ Tidak ada shift aktif. Buka shift terlebih dahulu.</p>
          </div>
        )}

        {customer && (
          <div className="pos-customer-bar">
            <span>👤 {customer.name}{customer.phone ? ` (${customer.phone})` : ''}</span>
            <button onClick={() => setCustomer(null)}>✕</button>
          </div>
        )}

        {!customer && (
          <button className="pos-customer-add" onClick={() => setShowCustomerPicker(true)}>
            + Pilih Pelanggan (Opsional)
          </button>
        )}

        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div className="pos-cart-empty">
              <p>Belum ada item dalam keranjang</p>
            </div>
          ) : (
            cart.map((x) => (
              <div className="cart-line" key={x.id}>
                <div className="cart-line-info">
                  <b>{x.name}</b>
                  <small>{x.sku} · Rp {x.selling_price.toLocaleString('id-ID')} × {x.quantity}</small>
                </div>
                <div className="cart-line-controls">
                  <input
                    type="number"
                    min="1"
                    max={x.available}
                    value={x.quantity}
                    aria-label={`Jumlah ${x.name}`}
                    onChange={(e) =>
                      setCart(cart.map((y) => y.id === x.id ? { ...y, quantity: Number(e.target.value) } : y))
                    }
                  />
                  {ctx.permissions.includes('pos.discount') && (
                    <>
                      <select
                        value={x.discountType ?? ''}
                        aria-label={`Diskon ${x.name}`}
                        onChange={(e) =>
                          setCart(cart.map((y) => y.id === x.id ? { ...y, discountType: (e.target.value as Line['discountType']) || undefined } : y))
                        }
                      >
                        <option value="">Diskon</option>
                        <option value="PERCENT">%</option>
                        <option value="FIXED">Rp</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        className="cart-line-disc"
                        value={x.discountValue}
                        aria-label={`Nilai diskon ${x.name}`}
                        onChange={(e) =>
                          setCart(cart.map((y) => y.id === x.id ? { ...y, discountValue: Number(e.target.value) } : y))
                        }
                      />
                    </>
                  )}
                  <span className="cart-line-total">
                    Rp {(x.selling_price * x.quantity).toLocaleString('id-ID')}
                  </span>
                  <button className="cart-line-remove" onClick={() => setCart(cart.filter((y) => y.id !== x.id))} aria-label={`Hapus ${x.name}`}>
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pos-cart-summary">
          <div className="pos-cart-row">
            <span>Subtotal</span>
            <span>Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          {itemDiscount > 0 && (
            <div className="pos-cart-row pos-cart-row--disc">
              <span>Diskon Item</span>
              <span>- Rp {itemDiscount.toLocaleString('id-ID')}</span>
            </div>
          )}
          {disc > 0 && (
            <div className="pos-cart-row pos-cart-row--disc">
              <span>Diskon Transaksi</span>
              <span>- Rp {disc.toLocaleString('id-ID')}</span>
            </div>
          )}
          {Number(tax) > 0 && (
            <div className="pos-cart-row">
              <span>Pajak ({tax}%)</span>
              <span>Rp {Math.round((subtotal - itemDiscount - disc) * Number(tax) / 100).toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="pos-cart-row pos-cart-row--total">
            <span>Total</span>
            <span>Rp {Math.round(total).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {ctx.permissions.includes('pos.discount') && (
          <div className="pos-cart-controls">
            <label>
              Diskon Transaksi (Rp)
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                aria-label="Diskon transaksi"
              />
            </label>
          </div>
        )}

        <div className="pos-cart-controls">
          <label>
            Pajak (%)
            <input
              type="number"
              min="0"
              max="100"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              aria-label="Pajak persen"
            />
          </label>
          <label>
            Catatan
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opsional..."
              aria-label="Catatan transaksi"
            />
          </label>
        </div>

        <label className="pos-method-label">
          Metode Pembayaran
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            aria-label="Metode pembayaran"
          >
            {['CASH', 'QRIS', 'BANK_TRANSFER', 'E_WALLET', 'OTHER'].map((x) => (
              <option key={x} value={x}>{x.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>

        {method === 'CASH' && (
          <div className="pos-cash-section">
            <label>
              Uang Diterima
              <input
                type="number"
                min={total}
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                placeholder={`Min. Rp ${Math.round(total).toLocaleString('id-ID')}`}
                aria-label="Uang diterima"
              />
            </label>
            {changeAmount > 0 && (
              <div className="pos-change">
                Kembalian: <b>Rp {changeAmount.toLocaleString('id-ID')}</b>
              </div>
            )}
          </div>
        )}

        <div className="pos-quick-cash">
          {[50000, 100000, 200000, 500000].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setReceived(String(amount))}
              className={Number(received) === amount ? 'active' : ''}
            >
              Rp {amount.toLocaleString('id-ID')}
            </button>
          ))}
        </div>

        <button
          className="pos-pay-btn"
          disabled={!cart.length || !shift}
          onClick={checkout}
        >
          💳 Bayar Rp {Math.round(total).toLocaleString('id-ID')}
        </button>

        {msg && <p className="pos-msg" role="status">{msg}</p>}
      </section>

      <div className="pos-mobile-cta" aria-hidden={false}>
        <span>
          <b>{itemCount}</b> item · Rp {Math.round(total).toLocaleString('id-ID')}
          {!shift && <small> · Buka shift</small>}
        </span>
        <button disabled={!cart.length || !shift} onClick={checkout}>
          Bayar
        </button>
      </div>

      {receipt && <Receipt sale={receipt} customer={customer} onClose={() => setReceipt(undefined)} />}

      {showCustomerPicker && (
        <div className="pos-modal-overlay" onClick={() => setShowCustomerPicker(false)}>
          <div className="pos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-header">
              <h3>Pilih Pelanggan</h3>
              <button onClick={() => setShowCustomerPicker(false)}>✕</button>
            </div>
            <input
              className="pos-modal-search"
              placeholder="Cari nama atau telepon..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              autoFocus
            />
            <div className="pos-customer-list">
              <button
                className="pos-customer-item"
                onClick={() => { setCustomer(null); setShowCustomerPicker(false); }}
              >
                <b>Tanpa Pelanggan</b>
                <small>Transaksi umum</small>
              </button>
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  className="pos-customer-item"
                  onClick={() => { setCustomer(c); setShowCustomerPicker(false); setCustomerSearch(''); }}
                >
                  <b>{c.name}</b>
                  <small>{c.phone ?? c.email ?? ''}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Receipt({ sale, customer, onClose }: { sale: any; customer?: Customer | null; onClose: () => void }) {
  const payment = Array.isArray(sale.payments) ? sale.payments[0] : sale.payment;
  return (
    <article className="receipt-paper">
      <img className="receipt-logo" src="/logo.png" alt="NIAGANTARA" />
      <p>
        {sale.store?.name ?? 'Store'} · {sale.branch?.name ?? sale.branch_id}
      </p>
      <b>{sale.transaction_number}</b>
      <small>{new Date(sale.created_at).toLocaleString('id-ID')}</small>
      {customer && (
        <small>Pelanggan: {customer.name}</small>
      )}
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
          Number(sale.item_discount_total ?? 0) + Number(sale.transaction_discount ?? 0)
        ).toLocaleString('id-ID')}
      </p>
      {Number(sale.tax ?? 0) > 0 && (
        <p>Pajak Rp {Number(sale.tax).toLocaleString('id-ID')}</p>
      )}
      <h3>Total Rp {Number(sale.grand_total).toLocaleString('id-ID')}</h3>
      <p>
        {payment?.method} · Received Rp{' '}
        {Number(payment?.amount_received ?? payment?.amount).toLocaleString('id-ID')}{' '}
        · Change Rp{' '}
        {Number(payment?.change_amount ?? 0).toLocaleString('id-ID')}
      </p>
      {sale.note && <p>Catatan: {sale.note}</p>}
      <div className="receipt-actions">
        <button onClick={() => window.print()}>Print</button>
        <button onClick={onClose}>Close</button>
      </div>
    </article>
  );
}

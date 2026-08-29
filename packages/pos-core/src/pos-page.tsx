import { FormEvent, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { cashChange } from './pos-logic';
import { normalizeReceipt } from './receipt-model';
import { useDialogFocus } from './dialog-focus';

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
  userId,
  ctx,
}: {
  company: string;
  token: string;
  userId: string;
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
  const [openingCash, setOpeningCash] = useState('');
  const [showOpenShift, setShowOpenShift] = useState(false);
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [closingCash, setClosingCash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [catalogState, setCatalogState] = useState<'LOADING'|'ERROR'|'EMPTY'|'NO_RESULTS'|'READY'>('LOADING');
  const [catalogError, setCatalogError] = useState('');
  const [barcodeState, setBarcodeState] = useState<'IDLE'|'SCANNING'|'LOOKING_UP'|'FOUND'|'UNKNOWN'|'INACTIVE'|'OUT_OF_STOCK'|'INSUFFICIENT_STOCK'|'OFFLINE'|'ERROR'>('IDLE');
  const [barcodeMessage, setBarcodeMessage] = useState('');
  const lastScan = useRef<{ code: string; at: number } | null>(null);
  const customerDialog = useDialogFocus(showCustomerPicker, () => setShowCustomerPicker(false));
  const openShiftDialog = useDialogFocus(showOpenShift, () => setShowOpenShift(false));
  const closeShiftDialog = useDialogFocus(showCloseShift, () => setShowCloseShift(false));
  const mobileCartDialog = useDialogFocus(showMobileCart, () => setShowMobileCart(false));

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

  useEffect(() => { const handler = (event: KeyboardEvent) => { const target = event.target as HTMLElement; if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return; if (event.key === 'F2') { event.preventDefault(); document.querySelector<HTMLInputElement>('.pos-products-panel .search input')?.focus(); } if (event.key === 'F4') { event.preventDefault(); setShowCustomerPicker(true); } if (event.key === 'F8') { event.preventDefault(); document.querySelector<HTMLButtonElement>('.pos-pay-btn')?.focus(); } if (event.key === 'Escape') { setShowCustomerPicker(false); setShowOpenShift(false); setShowCloseShift(false); } }; addEventListener('keydown', handler); return () => removeEventListener('keydown', handler); }, []);

  useEffect(() => { const on = () => setOnline(true); const off = () => setOnline(false); addEventListener('online', on); addEventListener('offline', off); return () => { removeEventListener('online', on); removeEventListener('offline', off); }; }, []);

  useEffect(() => {
    if (!showMobileCart) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [showMobileCart]);

  const search = async (e?: FormEvent) => {
    e?.preventDefault();
    if (branch && warehouse) {
      setCatalogState('LOADING'); setCatalogError('');
      try {
        const result = await api<any[]>(
          `/pos/products?warehouseId=${warehouse}&search=${encodeURIComponent(q)}${category ? `&categoryId=${encodeURIComponent(category)}` : ''}`,
          token,
          company,
          { headers: { 'x-branch-id': branch.id } },
        );
        setProducts(Array.isArray(result) ? result : []);
        setCatalogState(result.length ? 'READY' : (q || category ? 'NO_RESULTS' : 'EMPTY'));
      } catch { setCatalogState('ERROR'); setCatalogError('Katalog produk tidak dapat dimuat.'); }
    }
  };
  useEffect(() => { if (warehouse) void search(); }, [warehouse]);

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
    if (!branch || !online) { setBarcodeState('OFFLINE'); setBarcodeMessage('Koneksi diperlukan untuk memindai produk.'); return; }
    const code = q.trim(); if (!code) return;
    const now = Date.now(); if (lastScan.current && lastScan.current.code === code && now - lastScan.current.at < 700) return;
    lastScan.current = { code, at: now }; setBarcodeState('SCANNING'); setBarcodeMessage('Memindai barcode…');
    try {
      setBarcodeState('LOOKING_UP');
      const product = await api<any>(
          `/pos/barcode?warehouseId=${warehouse}&code=${encodeURIComponent(code)}`,
          token,
          company,
          { headers: { 'x-branch-id': branch.id } },
      );
      if (product.status && product.status !== 'active') { setBarcodeState('INACTIVE'); setBarcodeMessage('Produk tidak aktif.'); return; }
      const stock = Number(product.inventory?.quantity ?? 0);
      if (stock <= 0) { setBarcodeState('OUT_OF_STOCK'); setBarcodeMessage('Stok produk habis.'); return; }
      add(product); setBarcodeState('FOUND'); setBarcodeMessage(`${product.name} ditambahkan ke keranjang.`);
      setQ('');
    } catch (error) {
      const text = error instanceof Error && error.message.includes('offline') ? 'Koneksi diperlukan untuk memindai produk.' : 'Barcode tidak ditemukan atau gagal diproses.';
      setBarcodeState(text.startsWith('Koneksi') ? 'OFFLINE' : 'UNKNOWN'); setBarcodeMessage(text);
    }
    window.setTimeout(() => setBarcodeState('IDLE'), 1200);
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
  const changeAmount = method === 'CASH' ? (cashChange(total, Number(received || 0)) ?? 0) : 0;
  const itemCount = cart.reduce((n, x) => n + x.quantity, 0);
  const barcodeStatusText: Record<string, string> = {
    SCANNING: 'Memindai barcode…', LOOKING_UP: 'Mencari produk…', FOUND: 'Produk ditambahkan',
    UNKNOWN: 'Barcode tidak ditemukan', INACTIVE: 'Produk tidak aktif', OUT_OF_STOCK: 'Stok produk habis',
    INSUFFICIENT_STOCK: 'Stok tidak mencukupi', OFFLINE: 'Pemindaian membutuhkan koneksi', ERROR: 'Pemindaian gagal',
  };

  const checkout = async () => {
    if (!online) return setMsg('Koneksi diperlukan untuk menyelesaikan transaksi.');
    if (submitting) return;
    if (!branch || !store || !shift || !warehouse)
      return setMsg('Active shift required.');
    if (cart.some((x) => x.quantity > x.available))
      return setMsg('INSUFFICIENT_STOCK');
    if (method === 'CASH' && (!Number.isFinite(Number(received)) || Number(received) < total))
      return setMsg('Uang diterima belum mencukupi.');
    setSubmitting(true);
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
    } finally { setSubmitting(false);
    }
  };

  const openShift = async () => {
    if (!branch || !store || !Number.isFinite(Number(openingCash)) || Number(openingCash) < 0) return setMsg('Masukkan kas awal yang valid.');
    try { await api('/shifts/open', token, company, { method: 'POST', headers: { 'x-branch-id': branch.id }, body: JSON.stringify({ storeId: store.id, branchId: branch.id, openingCash: Number(openingCash) }) }); setShowOpenShift(false); const shifts = await api<any[]>('/shifts', token, company); setShift(shifts.find((x) => x.branch_id === branch.id && x.status === 'OPEN')); setMsg('Shift berhasil dibuka.'); } catch { setMsg('Shift gagal dibuka.'); }
  };
  const closeShift = async () => {
    if (!shift || !Number.isFinite(Number(closingCash)) || Number(closingCash) < 0) return setMsg('Masukkan kas akhir yang valid.');
    try { await api(`/shifts/${shift.id}/close`, token, company, { method: 'POST', headers: { 'x-branch-id': branch.id }, body: JSON.stringify({ closingCash: Number(closingCash) }) }); setShowCloseShift(false); setShift(undefined); setMsg('Shift berhasil ditutup.'); } catch { setMsg('Shift gagal ditutup.'); }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      !customerSearch ||
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch),
  );

  return (
    <div className="pos-grid">
      <header className="pos-workspace-header">
        <div>
          <span className="pos-workspace-eyebrow">POINT OF SALE</span>
          <h1>Transaksi Penjualan</h1>
          <p>{store?.name ?? 'Toko'} <span>•</span> {branch?.name ?? 'Cabang'}</p>
        </div>
        <div className="pos-workspace-status">
          <span className={`pos-online-pill${online ? '' : ' offline'}`}>
            <i /> {online ? 'Online' : 'Offline'}
          </span>
          <span className={`pos-shift-pill${shift ? '' : ' inactive'}`}>
            {shift ? 'Shift aktif' : 'Shift belum dibuka'}
          </span>
        </div>
      </header>
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
        <p className={`barcode-feedback barcode-feedback--${barcodeState.toLowerCase()}`} aria-live="polite">
          {barcodeMessage || barcodeStatusText[barcodeState] || 'Siap mencari produk atau memindai barcode'}
        </p>

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
          {catalogState === 'LOADING' && <div className="pos-empty-products" aria-live="polite"><p>Memuat katalog produk…</p></div>}
          {catalogState === 'ERROR' && <div className="pos-empty-products" role="alert"><p>{catalogError}</p><button type="button" onClick={() => void search()}>Coba lagi</button></div>}
          {catalogState === 'EMPTY' && <div className="pos-empty-products"><p>Belum ada produk untuk cabang ini.</p></div>}
          {catalogState === 'NO_RESULTS' && <div className="pos-empty-products"><p>Produk tidak ditemukan.</p></div>}
          {catalogState === 'READY' && (products.map((x: any) => (
              <button
                className="product-card"
                key={x.id}
                disabled={x.status !== 'active' || Number(x.inventory?.quantity ?? 0) <= 0}
                onClick={() => add(x)}
              >
                <b>{x.name}</b>
                <span className="product-card-sku">{x.sku}</span>
                <em className="product-card-price">
                  Rp {Number(x.selling_price).toLocaleString('id-ID')}
                </em>
                <small className={
                  Number(x.inventory?.quantity) <= 0 ? 'stock-out' :
                  Number(x.inventory?.quantity) <= Number(x.inventory?.minimum_stock ?? 0) ? 'stock-low' : ''
                }>
                  {x.status !== 'active' ? 'Tidak aktif' : Number(x.inventory?.quantity ?? 0) <= 0 ? 'Stok habis' : `Stok: ${x.inventory?.quantity ?? 0}`}
                </small>
              </button>
            ))
          )}
        </div>
      </section>

      <div
        className={`panel cart pos-cart-panel${showMobileCart ? ' mobile-open' : ''}`}
        ref={mobileCartDialog.dialogRef}
        onKeyDown={mobileCartDialog.onKeyDown}
        role={showMobileCart ? 'dialog' : undefined}
        aria-modal={showMobileCart ? 'true' : undefined}
        aria-labelledby="pos-cart-title"
        tabIndex={showMobileCart ? -1 : undefined}
      >
        <div className="pos-cart-header">
          <h2 id="pos-cart-title">Keranjang ({itemCount})</h2>
          <button className="pos-cart-mobile-close" type="button" aria-label="Tutup keranjang" onClick={() => setShowMobileCart(false)}>×</button>
          {shift && (
            <span className="pos-shift-badge">
              Shift Aktif — {shift.branch?.name ?? ''} <button type="button" onClick={() => setShowCloseShift(true)}>Tutup Shift</button>
            </span>
          )}
        </div>

        {!shift && (
          <div className="pos-no-shift">
            <p role="alert">Tidak ada shift aktif. Buka shift terlebih dahulu.</p><button type="button" onClick={() => setShowOpenShift(true)}>Buka Shift</button>
          </div>
        )}

        {customer && (
          <div className="pos-customer-bar">
            <span>Pelanggan: {customer.name}{customer.phone ? ` (${customer.phone})` : ''}</span>
            <button aria-label="Hapus pelanggan" onClick={() => setCustomer(null)}>×</button>
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
                  <button className="cart-qty-btn" type="button" aria-label={`Kurangi ${x.name}`} onClick={() => setCart(cart.flatMap((y) => y.id !== x.id ? [y] : y.quantity <= 1 ? [] : [{ ...y, quantity: y.quantity - 1 }]))}>−</button>
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
                  <button className="cart-qty-btn" type="button" aria-label={`Tambah ${x.name}`} disabled={x.quantity >= x.available} onClick={() => setCart(cart.map((y) => y.id === x.id ? { ...y, quantity: Math.min(y.available, y.quantity + 1) } : y))}>+</button>
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
                    ×
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
          disabled={!cart.length || !shift || !online || submitting}
          onClick={checkout}
        >
          {submitting ? 'Memproses…' : `Bayar Rp ${Math.round(total).toLocaleString('id-ID')}`}
        </button>

        {msg && <p className="pos-msg" role="status">{msg}</p>}
      </div>

      <div className="pos-mobile-cta" aria-hidden={false}>
        <span>
          <b>{itemCount}</b> item · Rp {Math.round(total).toLocaleString('id-ID')}
          {!shift && <small> · Buka shift</small>}
        </span>
        <button type="button" onClick={() => setShowMobileCart(true)}>
          Lihat Keranjang
        </button>
      </div>

      {receipt && <Receipt sale={receipt} customer={customer} onClose={() => setReceipt(undefined)} />}

      {showCustomerPicker && (
        <div className="pos-modal-overlay" onClick={() => setShowCustomerPicker(false)}>
          <div className="pos-modal" ref={customerDialog.dialogRef} onKeyDown={customerDialog.onKeyDown} role="dialog" aria-modal="true" aria-labelledby="customer-dialog-title" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-header">
              <h3 id="customer-dialog-title">Pilih Pelanggan</h3>
              <button aria-label="Tutup pemilih pelanggan" onClick={() => setShowCustomerPicker(false)}>×</button>
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
      {showOpenShift && <div className="pos-modal-overlay"><div className="pos-modal" ref={openShiftDialog.dialogRef} onKeyDown={openShiftDialog.onKeyDown} role="dialog" aria-modal="true" aria-labelledby="open-shift-title" tabIndex={-1}><h3 id="open-shift-title">Buka Shift</h3><label>Kas Awal<input type="number" min="0" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} /></label><button onClick={openShift}>Konfirmasi</button><button onClick={() => setShowOpenShift(false)}>Batal</button></div></div>}
      {showCloseShift && <div className="pos-modal-overlay"><div className="pos-modal" ref={closeShiftDialog.dialogRef} onKeyDown={closeShiftDialog.onKeyDown} role="dialog" aria-modal="true" aria-labelledby="close-shift-title" tabIndex={-1}><h3 id="close-shift-title">Tutup Shift</h3><label>Kas Akhir<input type="number" min="0" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} /></label><button onClick={closeShift}>Konfirmasi</button><button onClick={() => setShowCloseShift(false)}>Batal</button></div></div>}
    </div>
  );
}

export function Receipt({ sale, customer, onClose }: { sale: any; customer?: Customer | null; onClose: () => void }) {
  const receipt = normalizeReceipt(sale, customer);
  return (
    <article className="receipt-paper">
      <img className="receipt-logo" src="/logo.png" alt="NIAGANTARA" />
      <p>{receipt.store ?? 'Store'} · {receipt.branch ?? 'Branch'}</p>
      <b>{receipt.receiptNumber}</b><small>{new Date(receipt.createdAt).toLocaleString('id-ID')}</small>
      {receipt.customer && <small>Pelanggan: {receipt.customer}</small>}
      <hr />
      {receipt.items.map((x, index) => (
        <div key={index} className="receipt-line">
          <span>{x.name} × {x.quantity}</span><b>Rp {Number(x.lineTotal ?? 0).toLocaleString('id-ID')}</b>
        </div>
      ))}
      <hr />
      {receipt.subtotal != null && <p>Subtotal Rp {receipt.subtotal.toLocaleString('id-ID')}</p>}
      {receipt.discount != null && <p>Diskon Rp {receipt.discount.toLocaleString('id-ID')}</p>}
      {receipt.tax != null && receipt.tax > 0 && <p>Pajak Rp {receipt.tax.toLocaleString('id-ID')}</p>}
      <h3>Total Rp {receipt.grandTotal.toLocaleString('id-ID')}</h3>
      {receipt.paymentMethod && <p>{receipt.paymentMethod}{receipt.cashReceived != null ? ` · Diterima Rp ${receipt.cashReceived.toLocaleString('id-ID')}` : ''}{receipt.change != null ? ` · Kembalian Rp ${receipt.change.toLocaleString('id-ID')}` : ''}</p>}
      {sale.note && <p>Catatan: {sale.note}</p>}
      <div className="receipt-actions">
        <button onClick={() => window.print()}>Cetak Struk</button>
        <button onClick={onClose}>Transaksi Baru</button>
      </div>
    </article>
  );
}

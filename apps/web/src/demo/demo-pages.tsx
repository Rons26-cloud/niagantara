import { useMemo, useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  StatusBadge,
  Badge,
  Modal,
  SearchInput,
  Switch,
  Tabs,
  Pagination,
  usePaged,
  useTranslation,
  toast,
} from '@niagantara/ui';
import { Table2 } from 'lucide-react';
import { useDemoStore } from './demo-store';
import type {
  DemoCustomer,
  DemoEmployee,
  DemoExpense,
  DemoProduct,
  DemoPurchase,
  DemoSale,
  DemoSupplier,
} from './demo-types';

const useFmt = () => {
  const fmtCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Math.round(amount));
  return { fmtCurrency };
};

const todayISO = () => new Date().toISOString().split('T')[0];

const withoutId = <T extends { id: string }>({ id: _dropped, ...fields }: T): Omit<T, 'id'> => fields;

interface CartLine {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

interface ReceiptData {
  invoice: string;
  lines: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  payment: string;
}

export function DemoPOS() {
  const { t } = useTranslation();
  const { fmtCurrency } = useFmt();
  const {
    products,
    categories,
    sales,
    addSale,
    addStockMovement,
    branches,
    selectedBranch,
    employees,
  } = useDemoStore();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<'CASH' | 'QRIS' | 'TRANSFER'>('CASH');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const branchName =
    branches.find((b) => b.id === selectedBranch)?.name ?? '';
  const cashier = employees[0]?.name ?? 'Rony Tech';

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchQ =
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchC = category === 'all' || p.category === category;
    return matchQ && matchC;
  });

  const addToCart = (product: DemoProduct) => {
    const inCart = cart.find((l) => l.productId === product.id)?.quantity ?? 0;
    if (inCart + 1 > product.stock) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: product.sellingPrice,
          quantity: 1,
        },
      ];
    });
  };

  const setQty = (productId: string, qty: number) =>
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l)),
    );

  const subtotal = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const canPay = cart.length > 0;

  const handlePay = () => {
    if (!canPay) return;
    const seq = String(
      sales.filter((s) => s.invoice.startsWith('INV-DEMO-')).length + 1,
    ).padStart(3, '0');
    const invoice = `INV-DEMO-${seq}`;
    addSale({
      invoice,
      date: todayISO(),
      customer: 'Walk-in Customer',
      cashier,
      branch: branchName,
      total,
      payment,
      status: 'PAID',
      items: cart.reduce((sum, l) => sum + l.quantity, 0),
    });
    cart.forEach((line) => {
      addStockMovement({
        productId: line.productId,
        productName: line.name,
        type: 'SALE',
        quantity: -line.quantity,
        branch: branchName,
        date: todayISO(),
        reason: t('demo.posSaleReason'),
      });
    });
    setReceipt({ invoice, lines: cart, subtotal, discount, total, payment });
    setCart([]);
    setDiscount(0);
    toast(`${invoice} — ${t('demo.transactionSuccess')}`, 'success');
  };

  return (
    <div className="demo-pos">
      <div className="demo-pos-layout">
        <div className="demo-pos-catalog">
          <div className="demo-toolbar">
            <SearchInput value={search} onValueChange={setSearch} placeholder={t('pos.searchProduct')} />
            <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t('common.category')}>
              <option value="all">{t('demo.allCategories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="demo-chips" role="tablist" aria-label={t('common.category')}>
            <button
              className={`demo-chip${category === 'all' ? ' active' : ''}`}
              onClick={() => setCategory('all')}
            >
              {t('pos.allProducts')}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`demo-chip${category === c.name ? ' active' : ''}`}
                onClick={() => setCategory(c.name)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="demo-pos-products">
            {filtered.map((product) => {
              const out = product.stock <= 0;
              return (
                <button
                  key={product.id}
                  className="demo-pos-product-card"
                  onClick={() => addToCart(product)}
                  disabled={out}
                >
                  <span className="demo-pos-product-name">{product.name}</span>
                  <span className="demo-pos-product-price">{fmtCurrency(product.sellingPrice)}</span>
                  <span className="demo-pos-product-stock">
                    {out ? '—' : `${product.stock} ${product.unit}`}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="demo-empty-state">{t('demo.noProductsFound')}</p>}
          </div>
        </div>

        <div className="demo-pos-cart">
          <Card title={`${t('pos.cart')} (${cart.length})`}>
            <div className="demo-pos-cart-items">
              {cart.length === 0 && <p className="demo-pos-cart-empty">{t('demo.emptyCart')}</p>}
              {cart.map((line) => (
                <div key={line.productId} className="demo-pos-cart-item">
                  <div className="demo-pos-item-line">
                    <div className="demo-pos-item-info">
                      <span>{line.name}</span>
                      <small>{line.sku}</small>
                    </div>
                    <span className="demo-pos-item-total">
                      {fmtCurrency(line.price * line.quantity)}
                    </span>
                  </div>
                  <div className="demo-pos-item-line">
                    <div className="demo-pos-item-qty">
                      <button onClick={() => setQty(line.productId, line.quantity - 1)} aria-label="-">−</button>
                      <span aria-live="polite">{line.quantity}</span>
                      <button onClick={() => setQty(line.productId, line.quantity + 1)} aria-label="+">+</button>
                    </div>
                    <button
                      className="demo-pos-remove"
                      onClick={() => setQty(line.productId, 0)}
                      aria-label={t('common.delete')}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="demo-pos-cart-summary">
              <div className="demo-pos-summary-row">
                <span>{t('common.subtotal')}</span>
                <span>{fmtCurrency(subtotal)}</span>
              </div>
              <div className="demo-pos-summary-row">
                <label style={{ display: 'contents' }}>
                  {t('common.discount')}
                  <Input
                    type="number"
                    min={0}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                    aria-label={t('common.discount')}
                  />
                </label>
              </div>
              <div className="demo-pos-summary-row demo-grand">
                <span>{t('common.total')}</span>
                <span>{fmtCurrency(total)}</span>
              </div>
            </div>

            <div className="demo-pos-payment">
              <h3>{t('demo.paymentMethod')}</h3>
              <div className="demo-pos-payment-methods" role="radiogroup" aria-label={t('demo.paymentMethod')}>
                {(
                  [
                    ['CASH', t('demo.paymentCash')],
                    ['QRIS', 'QRIS'],
                    ['TRANSFER', t('demo.paymentTransfer')],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    variant={payment === value ? 'primary' : 'secondary'}
                    className={`demo-pay-btn${payment === value ? ' active' : ''}`}
                    onClick={() => setPayment(value)}
                    aria-pressed={payment === value}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Button onClick={handlePay} disabled={!canPay} loading={false}>
                {t('pos.pay')} · {fmtCurrency(total)}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        title={t('demo.transactionSuccess')}
        footer={
          <Button onClick={() => setReceipt(null)}>{t('common.close')}</Button>
        }
      >
        {receipt && (
          <div className="demo-receipt" role="document">
            <h3>✓ {t('demo.transactionSuccess')}</h3>
            <small className="demo-receipt-sub">{receipt.invoice}</small>
            <hr />
            {receipt.lines.map((line) => (
              <div className="demo-receipt-line" key={line.productId}>
                <span>
                  {line.name} ×{line.quantity}
                </span>
                <span>{fmtCurrency(line.price * line.quantity)}</span>
              </div>
            ))}
            <hr />
            <div className="demo-receipt-line">
              <span>{t('common.subtotal')}</span>
              <span>{fmtCurrency(receipt.subtotal)}</span>
            </div>
            <div className="demo-receipt-line">
              <span>{t('common.discount')}</span>
              <span>-{fmtCurrency(receipt.discount)}</span>
            </div>
            <div className="demo-receipt-total">
              <span>{t('common.total')}</span>
              <span>{fmtCurrency(receipt.total)}</span>
            </div>
            <hr />
            <div className="demo-receipt-line">
              <span>{t('demo.paymentMethod')}</span>
              <span>{receipt.payment}</span>
            </div>
            <p className="demo-receipt-note">{t('demo.sampleData')}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function DemoSales() {
  const { t } = useTranslation();
  const { fmtCurrency } = useFmt();
  const { sales, branches } = useDemoStore();

  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('all');
  const [payment, setPayment] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [detail, setDetail] = useState<DemoSale | null>(null);

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    const matchQ =
      s.invoice.toLowerCase().includes(q) ||
      s.customer.toLowerCase().includes(q) ||
      s.cashier.toLowerCase().includes(q);
    const matchB = branch === 'all' || s.branch === branch;
    const matchP = payment === 'all' || s.payment === payment;
    const matchD = !dateFrom || s.date >= dateFrom;
    return matchQ && matchB && matchP && matchD;
  });

  const paged = usePaged(filtered, 8);

  return (
    <div className="demo-sales">
      <Card title={t('pages.sales')}>
        <div className="demo-toolbar">
          <SearchInput value={search} onValueChange={setSearch} placeholder={t('common.search')} />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label={t('common.date')} />
          <Select value={branch} onChange={(e) => setBranch(e.target.value)} aria-label={t('context.branch')}>
            <option value="all">{t('demo.allBranches')}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </Select>
          <Select value={payment} onChange={(e) => setPayment(e.target.value)} aria-label={t('common.payment')}>
            <option value="all">{t('demo.allPayments')}</option>
            <option value="CASH">{t('demo.paymentCash')}</option>
            <option value="QRIS">QRIS</option>
            <option value="TRANSFER">{t('demo.paymentTransfer')}</option>
          </Select>
        </div>

        <div className="demo-table">
          <div className="demo-table-header demo-cols-8">
            <span>{t('demo.invoice')}</span>
            <span>{t('common.date')}</span>
            <span>{t('common.customer')}</span>
            <span>{t('demo.cashier')}</span>
            <span>{t('context.branch')}</span>
            <span>{t('common.total')}</span>
            <span>{t('common.payment')}</span>
            <span>{t('common.status')}</span>
          </div>
          {paged.slice.map((sale) => (
            <div
              key={sale.id}
              className="demo-table-row demo-cols-8 demo-table-row--clickable"
              onClick={() => setDetail(sale)}
              onKeyDown={(e) => e.key === 'Enter' && setDetail(sale)}
              tabIndex={0}
              role="button"
              aria-label={`${t('demo.saleDetail')} ${sale.invoice}`}
            >
              <span className="demo-mono">{sale.invoice}</span>
              <span>{sale.date}</span>
              <span>{sale.customer}</span>
              <span>{sale.cashier}</span>
              <span>{sale.branch}</span>
              <span className="demo-num">{fmtCurrency(sale.total)}</span>
              <span>{sale.payment}</span>
              <StatusBadge status={sale.status} />
            </div>
          ))}
          {filtered.length === 0 && <p className="demo-empty-state">{t('dashboard.noData')}</p>}
        </div>
        <Pagination page={paged.page} pageCount={paged.pageCount} onPage={paged.setPage} />
      </Card>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`${t('demo.saleDetail')} — ${detail?.invoice ?? ''}`}
        footer={<Button onClick={() => setDetail(null)}>{t('common.close')}</Button>}
      >
        {detail && (
          <dl className="demo-detail-grid">
            <dt>{t('demo.invoice')}</dt>
            <dd className="demo-mono">{detail.invoice}</dd>
            <dt>{t('common.date')}</dt>
            <dd>{detail.date}</dd>
            <dt>{t('common.customer')}</dt>
            <dd>{detail.customer}</dd>
            <dt>{t('demo.cashier')}</dt>
            <dd>{detail.cashier}</dd>
            <dt>{t('context.branch')}</dt>
            <dd>{detail.branch}</dd>
            <dt>{t('common.items')}</dt>
            <dd>{detail.items}</dd>
            <dt>{t('common.total')}</dt>
            <dd><b>{fmtCurrency(detail.total)}</b></dd>
            <dt>{t('common.payment')}</dt>
            <dd>{detail.payment}</dd>
            <dt>{t('common.status')}</dt>
            <dd><StatusBadge status={detail.status} /></dd>
          </dl>
        )}
      </Modal>
    </div>
  );
}

export function DemoShifts() {
  const { t } = useTranslation();
  const { fmtCurrency } = useFmt();
  const { shifts, openShift, closeShift, sales, branches, selectedBranch, employees } =
    useDemoStore();

  const [openingCash, setOpeningCash] = useState('500000');
  const [cashier, setCashier] = useState(employees[0]?.name ?? 'Dewi Lestari');
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closingCash, setClosingCash] = useState('');

  const branchName = branches.find((b) => b.id === selectedBranch)?.name ?? '';
  const activeShift = shifts.find((s) => s.status === 'OPEN');
  const demoCashSales = sales
    .filter((s) => s.payment === 'CASH' && s.invoice.startsWith('INV-DEMO-'))
    .reduce((sum, s) => sum + s.total, 0);
  const closingTarget = shifts.find((s) => s.id === closingId);
  const previewDiff =
    closingTarget != null && closingCash !== ''
      ? Number(closingCash) -
        (closingTarget.expectedCash + (closingTarget.status === 'OPEN' ? demoCashSales : 0))
      : null;

  const handleOpen = () => {
    openShift({
      cashier,
      branch: branchName,
      openingTime: new Date().toISOString(),
      openingCash: Number(openingCash) || 0,
      expectedCash: Number(openingCash) || 0,
    });
    toast(t('demo.shiftOpened'), 'success');
  };

  const handleClose = () => {
    if (!closingId || closingCash === '') return;
    closeShift(closingId, Number(closingCash));
    setClosingId(null);
    setClosingCash('');
    toast(t('messages.saveSuccess'), 'success');
  };

  return (
    <div className="demo-shifts">
      <Card title={t('demo.activeShift')}>
        {!activeShift ? (
          <form
            className="demo-inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleOpen();
            }}
          >
            <label>
              {t('demo.cashier')}
              <Select value={cashier} onChange={(e) => setCashier(e.target.value)}>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              {t('common.openingCash')}
              <Input
                type="number"
                min={0}
                required
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
              />
            </label>
            <Button type="submit">+ {t('demo.openShift')}</Button>
          </form>
        ) : (
          <div className="demo-shift-panel">
            <div className="demo-kpi-row">
              <div className="demo-kpi">
                <span>{t('demo.cashier')}</span>
                <b>{activeShift.cashier}</b>
              </div>
              <div className="demo-kpi">
                <span>{t('common.openingCash')}</span>
                <b>{fmtCurrency(activeShift.openingCash)}</b>
              </div>
              <div className="demo-kpi">
                <span>{t('common.expectedCash')}</span>
                <b>{fmtCurrency(activeShift.expectedCash + demoCashSales)}</b>
              </div>
              <div className="demo-kpi">
                <span>{t('common.openingTime')}</span>
                <b>{new Date(activeShift.openingTime).toLocaleTimeString()}</b>
              </div>
            </div>
            <div>
              <Button
                variant="danger"
                onClick={() => {
                  setClosingId(activeShift.id);
                  setClosingCash(String(activeShift.expectedCash + demoCashSales));
                }}
              >
                ■ {t('demo.closeShift')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card title={t('demo.shiftHistory')}>
        <div className="demo-table">
          <div className="demo-table-header demo-cols-7">
            <span>{t('demo.cashier')}</span>
            <span>{t('context.branch')}</span>
            <span>{t('common.openingTime')}</span>
            <span>{t('common.closingTime')}</span>
            <span>{t('common.openingCash')}</span>
            <span>{t('common.difference')}</span>
            <span>{t('common.status')}</span>
          </div>
          {shifts.map((shift) => (
            <div key={shift.id} className="demo-table-row demo-cols-7">
              <span>{shift.cashier}</span>
              <span>{shift.branch}</span>
              <span>{new Date(shift.openingTime).toLocaleString()}</span>
              <span>{shift.closingTime ? new Date(shift.closingTime).toLocaleString() : '—'}</span>
              <span className="demo-num">{fmtCurrency(shift.openingCash)}</span>
              <span
                className={`demo-num ${
                  shift.difference == null ? '' : shift.difference === 0 ? 'demo-positive' : 'demo-negative'
                }`}
              >
                {shift.difference == null
                  ? '—'
                  : `${shift.difference > 0 ? '+' : ''}${fmtCurrency(shift.difference)}`}
              </span>
              <StatusBadge status={shift.status} />
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={!!closingId}
        onClose={() => setClosingId(null)}
        title={t('demo.closeShift')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setClosingId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleClose}>
              {t('demo.closeShift')}
            </Button>
          </>
        }
      >
        <div className="demo-form-grid">
          <label>
            {t('common.closingCash')}
            <Input
              type="number"
              min={0}
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
            />
          </label>
          <label>
            {t('common.difference')}
            <Input readOnly value={previewDiff != null ? String(previewDiff) : ''} />
          </label>
        </div>
      </Modal>
    </div>
  );
}

const emptyCustomer: Omit<DemoCustomer, 'id'> = {
  name: '',
  email: '',
  phone: '',
  address: '',
  totalPurchases: 0,
  lastPurchase: '',
};

export function DemoCustomers() {
  const { t } = useTranslation();
  const { fmtCurrency } = useFmt();
  const { customers, addCustomer, updateCustomer } = useDemoStore();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<DemoCustomer | null>(null);
  const [form, setForm] = useState<Omit<DemoCustomer, 'id'>>(emptyCustomer);
  const [detail, setDetail] = useState<DemoCustomer | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  const openAdd = () => {
    setEditing({ ...emptyCustomer, id: '' } as DemoCustomer);
    setForm(emptyCustomer);
  };
  const openEdit = (customer: DemoCustomer) => {
    setEditing(customer);
    setForm(withoutId(customer));
  };
  const save = () => {
    if (!editing) return;
    if (editing.id) {
      updateCustomer(editing.id, form);
    } else {
      addCustomer(form);
    }
    toast(t('messages.saveSuccess'), 'success');
    setEditing(null);
  };

  return (
    <div className="demo-customers">
      <Card
        title={t('pages.customers')}
        actions={<Button onClick={openAdd}>+ {t('common.add')}</Button>}
      >
        <div className="demo-toolbar">
          <SearchInput value={search} onValueChange={setSearch} placeholder={t('common.search')} />
        </div>
        <div className="demo-table">
          <div className="demo-table-header demo-cols-5">
            <span>{t('common.name')}</span>
            <span>{t('common.phone')}</span>
            <span>{t('common.email')}</span>
            <span>{t('demo.totalPurchases')}</span>
            <span>{t('common.actions')}</span>
          </div>
          {filtered.map((customer) => (
            <div
              key={customer.id}
              className="demo-table-row demo-cols-5 demo-table-row--clickable"
              onClick={() => setDetail(customer)}
              onKeyDown={(e) => e.key === 'Enter' && setDetail(customer)}
              tabIndex={0}
              role="button"
            >
              <span>{customer.name}</span>
              <span>{customer.phone}</span>
              <span>{customer.email}</span>
              <span className="demo-num">{fmtCurrency(customer.totalPurchases)}</span>
              <div className="demo-table-actions" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" onClick={() => openEdit(customer)}>
                  {t('common.edit')}
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="demo-empty-state">{t('dashboard.noData')}</p>}
        </div>
      </Card>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        footer={<Button onClick={() => setDetail(null)}>{t('common.close')}</Button>}
      >
        {detail && (
          <dl className="demo-detail-grid">
            <dt>{t('common.phone')}</dt>
            <dd>{detail.phone}</dd>
            <dt>{t('common.email')}</dt>
            <dd>{detail.email}</dd>
            <dt>{t('common.address')}</dt>
            <dd>{detail.address}</dd>
            <dt>{t('demo.totalPurchases')}</dt>
            <dd>{fmtCurrency(detail.totalPurchases)}</dd>
            <dt>{t('common.date')}</dt>
            <dd>{detail.lastPurchase || '—'}</dd>
          </dl>
        )}
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? t('common.edit') : t('common.add')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={save}>{t('common.save')}</Button>
          </>
        }
      >
        <form className="demo-form-grid" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <label>
            {t('common.name')}
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            {t('common.phone')}
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="demo-form-full">
            {t('common.email')}
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="demo-form-full">
            {t('common.address')}
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
        </form>
      </Modal>
    </div>
  );
}

const emptySupplier: Omit<DemoSupplier, 'id'> = {
  name: '',
  email: '',
  phone: '',
  address: '',
  contactPerson: '',
};

export function DemoSuppliers() {
  const { t } = useTranslation();
  const { suppliers, addSupplier, updateSupplier } = useDemoStore();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<DemoSupplier | null>(null);
  const [form, setForm] = useState<Omit<DemoSupplier, 'id'>>(emptySupplier);

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditing({ ...emptySupplier, id: '' } as DemoSupplier);
    setForm(emptySupplier);
  };
  const openEdit = (supplier: DemoSupplier) => {
    setEditing(supplier);
    setForm(withoutId(supplier));
  };
  const save = () => {
    if (!editing) return;
    if (editing.id) updateSupplier(editing.id, form);
    else addSupplier(form);
    toast(t('messages.saveSuccess'), 'success');
    setEditing(null);
  };

  return (
    <div className="demo-suppliers">
      <Card
        title={t('pages.suppliers')}
        actions={<Button onClick={openAdd}>+ {t('common.add')}</Button>}
      >
        <div className="demo-toolbar">
          <SearchInput value={search} onValueChange={setSearch} placeholder={t('common.search')} />
        </div>
        <div className="demo-table">
          <div className="demo-table-header demo-cols-5">
            <span>{t('common.name')}</span>
            <span>{t('demo.contactPerson')}</span>
            <span>{t('common.phone')}</span>
            <span>{t('common.email')}</span>
            <span>{t('common.actions')}</span>
          </div>
          {filtered.map((supplier) => (
            <div key={supplier.id} className="demo-table-row demo-cols-5">
              <span>{supplier.name}</span>
              <span>{supplier.contactPerson}</span>
              <span>{supplier.phone}</span>
              <span>{supplier.email}</span>
              <div className="demo-table-actions">
                <Button variant="ghost" onClick={() => openEdit(supplier)}>
                  {t('common.edit')}
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="demo-empty-state">{t('dashboard.noData')}</p>}
        </div>
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? t('common.edit') : t('common.add')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={save}>{t('common.save')}</Button>
          </>
        }
      >
        <form className="demo-form-grid" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <label>
            {t('common.name')}
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            {t('demo.contactPerson')}
            <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          </label>
          <label>
            {t('common.phone')}
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label>
            {t('common.email')}
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="demo-form-full">
            {t('common.address')}
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
        </form>
      </Modal>
    </div>
  );
}

export function DemoPurchases() {
  const { t } = useTranslation();
  const { fmtCurrency } = useFmt();
  const { purchases, suppliers, products, branches, selectedBranch, addPurchase, updatePurchaseStatus, addStockMovement } =
    useDemoStore();
  const [creating, setCreating] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('10');

  const branchName = branches.find((b) => b.id === selectedBranch)?.name ?? '';

  const receive = (purchase: DemoPurchase) => {
    updatePurchaseStatus(purchase.id, 'RECEIVED');
    if (purchase.productId && purchase.quantity) {
      addStockMovement({
        productId: purchase.productId,
        productName: purchase.productName ?? '',
        type: 'PURCHASE',
        quantity: purchase.quantity,
        branch: purchase.branch,
        date: todayISO(),
        reason: t('demo.purchaseReceivedReason'),
      });
    }
    toast(t('demo.receiveSuccess'), 'success');
  };

  const save = () => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    const product = products.find((p) => p.id === productId);
    if (!supplier || !product) return;
    const qty = Number(quantity) || 0;
    addPurchase({
      invoice: `PO-DEMO-${String(purchases.length + 1).padStart(3, '0')}`,
      date: todayISO(),
      supplier: supplier.name,
      branch: branchName,
      total: product.costPrice * qty,
      status: 'PENDING',
      items: qty,
      productId: product.id,
      productName: product.name,
      quantity: qty,
    });
    setCreating(false);
    setQuantity('10');
    toast(t('messages.saveSuccess'), 'success');
  };

  return (
    <div className="demo-purchases">
      <Card
        title={t('pages.purchases')}
        actions={<Button onClick={() => setCreating(true)}>+ {t('common.add')}</Button>}
      >
        <div className="demo-table">
          <div className="demo-table-header demo-cols-6">
            <span>{t('demo.invoice')}</span>
            <span>{t('common.date')}</span>
            <span>{t('common.supplier')}</span>
            <span>{t('common.total')}</span>
            <span>{t('common.status')}</span>
            <span>{t('common.actions')}</span>
          </div>
          {purchases.map((purchase) => (
            <div key={purchase.id} className="demo-table-row demo-cols-6">
              <span className="demo-mono">{purchase.invoice}</span>
              <span>{purchase.date}</span>
              <span>{purchase.supplier}</span>
              <span className="demo-num">{fmtCurrency(purchase.total)}</span>
              <StatusBadge status={purchase.status} />
              <div className="demo-table-actions">
                {purchase.status === 'PENDING' && (
                  <Button onClick={() => receive(purchase)}>✓ {t('demo.receive')}</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title={t('common.add')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={save}>{t('common.save')}</Button>
          </>
        }
      >
        <form
          className="demo-form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="demo-form-full">
            {t('common.supplier')}
            <Select required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">—</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="demo-form-full">
            {t('demo.selectProduct')}
            <Select required value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">—</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            {t('common.quantity')}
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
        </form>
      </Modal>
    </div>
  );
}

export function DemoEmployees() {
  const { t } = useTranslation();
  const { employees, branches, addEmployee, updateEmployee } = useDemoStore();
  const [editing, setEditing] = useState<DemoEmployee | null>(null);
  const [form, setForm] = useState<Omit<DemoEmployee, 'id'>>({
    name: '',
    email: '',
    phone: '',
    role: 'Kasir',
    branch: '',
    status: 'ACTIVE',
  });

  const openAdd = () => {
    setEditing({ id: '', name: '', email: '', phone: '', role: 'Kasir', branch: branches[0]?.name ?? '', status: 'ACTIVE' });
    setForm({
      name: '',
      email: '',
      phone: '',
      role: 'Kasir',
      branch: branches[0]?.name ?? '',
      status: 'ACTIVE',
    });
  };
  const openEdit = (employee: DemoEmployee) => {
    setEditing(employee);
    setForm(withoutId(employee));
  };
  const save = () => {
    if (!editing) return;
    if (editing.id) updateEmployee(editing.id, form);
    else addEmployee(form);
    toast(t('messages.saveSuccess'), 'success');
    setEditing(null);
  };

  return (
    <div className="demo-employees">
      <Card
        title={t('pages.employees')}
        actions={<Button onClick={openAdd}>+ {t('common.add')}</Button>}
      >
        <div className="demo-table">
          <div className="demo-table-header demo-cols-6">
            <span>{t('common.name')}</span>
            <span>{t('common.email')}</span>
            <span>{t('demo.role')}</span>
            <span>{t('context.branch')}</span>
            <span>{t('common.status')}</span>
            <span>{t('common.actions')}</span>
          </div>
          {employees.map((employee) => (
            <div key={employee.id} className="demo-table-row demo-cols-6">
              <span>{employee.name}</span>
              <span>{employee.email}</span>
              <span>{employee.role}</span>
              <span>{employee.branch}</span>
              <StatusBadge status={employee.status} />
              <div className="demo-table-actions">
                <Button variant="ghost" onClick={() => openEdit(employee)}>
                  {t('common.edit')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? t('common.edit') : t('common.add')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={save}>{t('common.save')}</Button>
          </>
        }
      >
        <form className="demo-form-grid" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <label>
            {t('common.name')}
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            {t('demo.role')}
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {['Owner', 'Manager', 'Kasir', 'Gudang'].map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </label>
          <label>
            {t('common.email')}
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label>
            {t('common.phone')}
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label>
            {t('context.branch')}
            <Select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            {t('common.status')}
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as DemoEmployee['status'] })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </Select>
          </label>
        </form>
      </Modal>
    </div>
  );
}

export function DemoAttendance() {
  const { t } = useTranslation();
  const { attendance, employees, branches, selectedBranch, clockIn, clockOut } = useDemoStore();
  const [employeeId, setEmployeeId] = useState('');

  const branchName = branches.find((b) => b.id === selectedBranch)?.name ?? '';

  const handleClockIn = () => {
    const employee = employees.find((e) => e.id === employeeId) ?? employees[0];
    if (!employee) return;
    clockIn(employee.id, employee.name, employee.branch || branchName);
    toast(t('demo.clockInSuccess'), 'success');
  };

  const handleClockOut = (id: string) => {
    clockOut(id);
    toast(t('demo.clockOutSuccess'), 'success');
  };

  return (
    <div className="demo-attendance">
      <Card title={t('pages.attendance')}>
        <form
          className="demo-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            handleClockIn();
          }}
        >
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} aria-label={t('common.employee')}>
            <option value="">— {t('common.employee')} —</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </Select>
          <Button type="submit">● {t('demo.clockIn')}</Button>
        </form>

        <div className="demo-table">
          <div className="demo-table-header demo-cols-6">
            <span>{t('common.employee')}</span>
            <span>{t('common.date')}</span>
            <span>{t('demo.clockIn')}</span>
            <span>{t('demo.clockOut')}</span>
            <span>{t('context.branch')}</span>
            <span>{t('common.actions')}</span>
          </div>
          {attendance.map((att) => (
            <div key={att.id} className="demo-table-row demo-cols-6">
              <span>{att.employeeName}</span>
              <span>{att.date}</span>
              <span>{att.clockIn}</span>
              <span>{att.clockOut ?? '—'}</span>
              <span>{att.branch}</span>
              <div className="demo-table-actions">
                {!att.clockOut && (
                  <Button variant="secondary" onClick={() => handleClockOut(att.id)}>
                    ○ {t('demo.clockOut')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function DemoExpenses() {
  const { t } = useTranslation();
  const { fmtCurrency } = useFmt();
  const { expenses, branches, selectedBranch, addExpense, deleteExpense } = useDemoStore();
  const [category, setCategory] = useState('Operasional');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const branchName = branches.find((b) => b.id === selectedBranch)?.name ?? '';

  const save = () => {
    if (!amount) return;
    addExpense({
      category,
      amount: Number(amount),
      date: todayISO(),
      branch: branchName,
      description,
    });
    setAmount('');
    setDescription('');
    toast(t('messages.saveSuccess'), 'success');
  };

  return (
    <div className="demo-expenses">
      <Card title={t('demo.addExpense')}>
        <form
          className="demo-inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label>
            {t('common.category')}
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {['Operasional', 'Listrik', 'Transportasi', 'ATK', 'Gaji', 'Lainnya'].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </label>
          <label>
            {t('common.amount')}
            <Input type="number" min={0} required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label>
            {t('common.description')}
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <Button type="submit">+ {t('common.save')}</Button>
        </form>
      </Card>

      <Card title={t('pages.expenses')}>
        <div className="demo-table">
          <div className="demo-table-header demo-cols-5">
            <span>{t('common.date')}</span>
            <span>{t('common.category')}</span>
            <span>{t('common.description')}</span>
            <span>{t('common.amount')}</span>
            <span>{t('common.actions')}</span>
          </div>
          {expenses.map((expense: DemoExpense) => (
            <div key={expense.id} className="demo-table-row demo-cols-5">
              <span>{expense.date}</span>
              <span><Badge tone="neutral">{expense.category}</Badge></span>
              <span>{expense.description || '—'}</span>
              <span className="demo-num">{fmtCurrency(expense.amount)}</span>
              <div className="demo-table-actions">
                <Button variant="danger" onClick={() => setConfirmId(expense.id)}>
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title={t('common.delete')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmId(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmId) deleteExpense(confirmId);
                setConfirmId(null);
                toast(t('messages.deleteSuccess'), 'success');
              }}
            >
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p>{t('messages.confirmDelete')}</p>
      </Modal>
    </div>
  );
}

export function DemoFinance() {
  const { t } = useTranslation();
  const { fmtCurrency } = useFmt();
  const { finance } = useDemoStore();

  const items: [string, number][] = [
    [t('demo.finance.cash'), finance.cash],
    [t('demo.finance.bank'), finance.bank],
    [t('demo.finance.receivable'), finance.receivable],
    [t('demo.finance.payable'), finance.payable],
    [t('demo.finance.revenue'), finance.revenue],
    [t('demo.finance.expense'), finance.expense],
  ];

  return (
    <div className="demo-finance">
      <div className="demo-finance-summary">
        {items.map(([label, value]) => (
          <div className="demo-finance-item" key={label}>
            <span>{label}</span>
            <b>{fmtCurrency(value)}</b>
          </div>
        ))}
        <div className="demo-finance-item demo-finance-profit">
          <span>{t('demo.finance.profit')}</span>
          <b>{fmtCurrency(finance.profit)}</b>
        </div>
      </div>
    </div>
  );
}

const PERIOD_FACTORS: Record<string, number> = {
  week: 1,
  month: 4.3,
  quarter: 13,
  year: 52,
};

export function DemoReports() {
  const { t } = useTranslation();
  const { fmtCurrency } = useFmt();
  const { branches, expenses } = useDemoStore();

  const [period, setPeriod] = useState('month');
  const [branch, setBranch] = useState('all');
  const [reportType, setReportType] = useState('sales');

  const periodFactor = PERIOD_FACTORS[period] ?? 1;
  const branchFactor =
    branch === 'all' ? 1.69 : { 'branch-1': 1, 'branch-2': 0.42, 'branch-3': 0.27 }[branch] ?? 1;
  const f = periodFactor * branchFactor;

  const WEEK = ['W1', 'W2', 'W3', 'W4'] as const;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'] as const;

  const chart = useMemo(() => {
    const baseSales = [34, 41, 38, 46];
    const labels = period === 'year' ? MONTHS : WEEK;
    const scale = period === 'year' ? 8600000 : 6200000;
    return Array.from(labels).map((label, i) => {
      let v: number;
      if (reportType === 'expenses') {
        v = scale * 0.62 * ((i % 4) * 0.08 + 0.78);
      } else if (reportType === 'profit') {
        v = scale * 0.31 * ((i % 4) * 0.09 + 0.72);
      } else {
        v = scale * (baseSales[i % baseSales.length] / 46);
      }
      return { label, value: Math.round(v * (period === 'year' ? 1 : f)) };
    });
  }, [period, reportType, f]);

  const maxVal = Math.max(...chart.map((c) => c.value));
  const totalSales = Math.round(12842000 * f);
  const totalExpenses = Math.round(
    expenses.reduce((sum, e) => sum + e.amount, 0) * (period === 'week' ? 0.25 : periodFactor / 4.3),
  );
  const totalProfit = totalSales - totalExpenses;

  const stats: [string, string][] = [
    [t('dashboard.totalSales'), fmtCurrency(reportType === 'profit' ? totalProfit : totalSales)],
    [
      t('dashboard.todayTransactions'),
      String(Math.round(32 * (period === 'week' ? 1 : periodFactor) * branchFactor)),
    ],
    [t('demo.finance.expense'), fmtCurrency(totalExpenses)],
    [t('demo.finance.profit'), fmtCurrency(totalProfit)],
  ];

  return (
    <div className="demo-reports">
      <Card title={t('pages.reports')}>
        <div className="demo-toolbar">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label={t('common.date')}>
            <option value="week">{t('demo.thisWeek')}</option>
            <option value="month">{t('demo.thisMonth')}</option>
            <option value="quarter">{t('demo.thisQuarter')}</option>
            <option value="year">{t('demo.thisYear')}</option>
          </Select>
          <Select value={branch} onChange={(e) => setBranch(e.target.value)} aria-label={t('context.branch')}>
            <option value="all">{t('demo.allBranches')}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <Select value={reportType} onChange={(e) => setReportType(e.target.value)} aria-label={t('demo.reportType')}>
            <option value="sales">{t('dashboard.totalSales')}</option>
            <option value="expenses">{t('demo.finance.expense')}</option>
            <option value="profit">{t('demo.finance.profit')}</option>
          </Select>
        </div>

        <div className="demo-report-stats">
          {stats.map(([label, value]) => (
            <div className="demo-kpi" key={label}>
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>

        <div className="demo-chart-container">
          <div className="demo-bar-chart" role="img" aria-label={t('pages.reports')}>
            {chart.map((item) => (
              <div key={item.label} className="demo-bar-group">
                <div
                  className="demo-bar"
                  style={{ height: `${(item.value / maxVal) * 100}%` }}
                  title={fmtCurrency(item.value)}
                />
                <span className="demo-bar-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="demo-settings-note">{t('demo.sampleData')}</p>
      </Card>
    </div>
  );
}

export function DemoInventory() {
  const { t } = useTranslation();
  const { products, stockMovements, warehouses, branches, stores } = useDemoStore();
  const [tab, setTab] = useState('overview');
  const [movementFilter, setMovementFilter] = useState('ALL');

  const lowStockProducts = products.filter((p) => p.stock <= p.minimumStock);
  const movements = stockMovements.filter(
    (m) => movementFilter === 'ALL' || m.type === movementFilter,
  );

  const tabs = [
    { id: 'overview', label: t('demo.inventoryOverview') },
    { id: 'low', label: t('dashboard.lowStock') },
    { id: 'warehouses', label: t('pages.warehouses') },
    { id: 'movements', label: t('demo.stockMovements') },
  ];

  return (
    <div className="demo-inventory">
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <Card title={t('demo.inventoryOverview')}>
          <div className="demo-table">
            <div className="demo-table-header demo-cols-5">
              <span>{t('common.product')}</span>
              <span>{t('common.category')}</span>
              <span>{t('common.stock')}</span>
              <span>{t('inventory.minimumStock')}</span>
              <span>{t('common.status')}</span>
            </div>
            {products.map((product) => (
              <div key={product.id} className="demo-table-row demo-cols-5">
                <span>{product.name}</span>
                <span><Badge tone="neutral">{product.category}</Badge></span>
                <span className={`demo-num ${product.stock <= product.minimumStock ? 'demo-low-stock' : ''}`}>
                  {product.stock} {product.unit}
                </span>
                <span className="demo-num">
                  {product.minimumStock} {product.unit}
                </span>
                <StatusBadge status={product.stock <= 0 ? 'OUT_OF_STOCK' : product.stock <= product.minimumStock ? 'LOW_STOCK' : 'ACTIVE'} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'low' && (
        <Card title={t('dashboard.lowStock')}>
          {lowStockProducts.length === 0 ? (
            <p className="demo-empty-state">{t('dashboard.noData')}</p>
          ) : (
            <ul className="demo-mini-list">
              {lowStockProducts.map((product) => (
                <li key={product.id}>
                  <span className="demo-mini-main">
                    <b>{product.name}</b>
                    <small>
                      {product.stock} / min {product.minimumStock} {product.unit}
                    </small>
                  </span>
                  <StatusBadge status="LOW_STOCK" />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'warehouses' && (
        <Card title={t('pages.warehouses')}>
          <div className="demo-table">
            <div className="demo-table-header demo-cols-4">
              <span>{t('common.name')}</span>
              <span>{t('common.code')}</span>
              <span>{t('context.store')}</span>
              <span>{t('context.branch')}</span>
            </div>
            {warehouses.map((wh) => (
              <div key={wh.id} className="demo-table-row demo-cols-4">
                <span>{wh.name}</span>
                <span className="demo-mono">{wh.code}</span>
                <span>{stores.find((s) => s.id === wh.storeId)?.name ?? '—'}</span>
                <span>{branches.find((b) => b.id === wh.branchId)?.name ?? '—'}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'movements' && (
        <Card title={t('demo.stockMovements')}>
          <div className="demo-toolbar">
            <Select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              aria-label={t('common.type')}
            >
              <option value="ALL">{t('dashboard.viewAll')}</option>
              {['SALE', 'PURCHASE', 'ADJUSTMENT', 'TRANSFER', 'RETURN'].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
          <div className="demo-table">
            <div className="demo-table-header demo-cols-5">
              <span>{t('common.date')}</span>
              <span>{t('common.product')}</span>
              <span>{t('common.type')}</span>
              <span>{t('common.quantity')}</span>
              <span>{t('demo.reason')}</span>
            </div>
            {movements.map((movement) => (
              <div key={movement.id} className="demo-table-row demo-cols-5">
                <span>{movement.date}</span>
                <span>{movement.productName}</span>
                <span><Badge tone="info">{movement.type}</Badge></span>
                <span className={`demo-num ${movement.quantity < 0 ? 'demo-negative' : 'demo-positive'}`}>
                  {movement.quantity > 0 ? '+' : ''}
                  {movement.quantity}
                </span>
                <span>{movement.reason ?? '—'}</span>
              </div>
            ))}
            {movements.length === 0 && <p className="demo-empty-state">{t('dashboard.noData')}</p>}
          </div>
        </Card>
      )}
    </div>
  );
}

export function DemoStockTransfer() {
  const { t } = useTranslation();
  const { products, branches, addStockMovement } = useDemoStore();
  const [fromBranch, setFromBranch] = useState('branch-1');
  const [toBranch, setToBranch] = useState('branch-2');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');

  const product = products.find((p) => p.id === productId);
  const fromName = branches.find((b) => b.id === fromBranch)?.name ?? '';
  const toName = branches.find((b) => b.id === toBranch)?.name ?? '';
  const qty = Number(quantity) || 0;
  const valid =
    fromBranch !== toBranch && !!productId && qty > 0 && !!product && qty <= product.stock;

  const handleTransfer = () => {
    if (!valid || !product) return;
    addStockMovement({
      productId: product.id,
      productName: product.name,
      type: 'TRANSFER',
      quantity: -qty,
      branch: fromName,
      date: todayISO(),
      reason: reason || `${t('demo.transferTo')} ${toName}`,
    });
    addStockMovement({
      productId: product.id,
      productName: product.name,
      type: 'TRANSFER',
      quantity: qty,
      branch: toName,
      date: todayISO(),
      reason: reason || `${t('demo.transferFrom')} ${fromName}`,
    });
    toast(t('demo.stockTransferred'), 'success');
    setQuantity('1');
    setReason('');
  };

  return (
    <div className="demo-stock-transfer">
      <Card title={t('pages.stockTransfer')}>
        <form
          className="demo-transfer-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleTransfer();
          }}
        >
          <label>
            {t('demo.fromBranch')}
            <Select value={fromBranch} onChange={(e) => setFromBranch(e.target.value)} required>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            {t('demo.toBranch')}
            <Select value={toBranch} onChange={(e) => setToBranch(e.target.value)} required>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </label>
          <label>
            {t('demo.selectProduct')}
            <Select value={productId} onChange={(e) => setProductId(e.target.value)} required>
              <option value="">—</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stock} {p.unit})
                </option>
              ))}
            </Select>
          </label>
          <label>
            {t('common.quantity')}
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </label>
          <label>
            {t('demo.reason')}
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={`${t('common.stock')}…`} />
          </label>
          <Button type="submit" disabled={!valid}>
            ⇄ {t('demo.transfer')}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export function DemoCategories() {
  const { t } = useTranslation();
  const { categories, products } = useDemoStore();
  return (
    <div className="demo-categories">
      <Card title={t('pages.categories')}>
        <div className="demo-table">
          <div className="demo-table-header demo-cols-3">
            <span>{t('common.name')}</span>
            <span>{t('common.description')}</span>
            <span>{t('common.product')}</span>
          </div>
          {categories.map((cat) => (
            <div key={cat.id} className="demo-table-row demo-cols-3">
              <span>{cat.name}</span>
              <span>{cat.description}</span>
              <span className="demo-num">{products.filter((p) => p.category === cat.name).length}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function DemoWarehouses() {
  const { t } = useTranslation();
  const { warehouses, branches, stores } = useDemoStore();
  return (
    <div className="demo-warehouses">
      <Card title={t('pages.warehouses')}>
        <div className="demo-table">
          <div className="demo-table-header demo-cols-4">
            <span>{t('common.name')}</span>
            <span>{t('common.code')}</span>
            <span>{t('context.store')}</span>
            <span>{t('context.branch')}</span>
          </div>
          {warehouses.map((wh) => (
            <div key={wh.id} className="demo-table-row demo-cols-4">
              <span>{wh.name}</span>
              <span className="demo-mono">{wh.code}</span>
              <span>{stores.find((s) => s.id === wh.storeId)?.name ?? '—'}</span>
              <span>{branches.find((b) => b.id === wh.branchId)?.name ?? '—'}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function DemoBranches() {
  const { t } = useTranslation();
  const { branches, stores } = useDemoStore();
  return (
    <div className="demo-branches">
      <Card title={t('pages.branches')}>
        <div className="demo-table">
          <div className="demo-table-header demo-cols-4">
            <span>{t('common.name')}</span>
            <span>{t('common.code')}</span>
            <span>{t('context.store')}</span>
            <span>{t('common.status')}</span>
          </div>
          {branches.map((branch) => (
            <div key={branch.id} className="demo-table-row demo-cols-4">
              <span>{branch.name}</span>
              <span className="demo-mono">{branch.code}</span>
              <span>{stores.find((s) => s.id === branch.storeId)?.name ?? '—'}</span>
              <StatusBadge status="ACTIVE" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function DemoStores() {
  const { t } = useTranslation();
  const { stores, branches } = useDemoStore();
  return (
    <div className="demo-stores">
      <Card title={t('pages.stores')}>
        <div className="demo-table">
          <div className="demo-table-header demo-cols-3">
            <span>{t('common.name')}</span>
            <span>{t('pages.branches')}</span>
            <span>{t('common.status')}</span>
          </div>
          {stores.map((store) => (
            <div key={store.id} className="demo-table-row demo-cols-3">
              <span>{store.name}</span>
              <span>{branches.filter((b) => b.storeId === store.id).length}</span>
              <StatusBadge status="ACTIVE" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const SHEET_ROWS = 6;
const SHEET_COLS = ['A', 'B', 'C', 'D'];

export function DemoGoogleSheets() {
  const { t } = useTranslation();
  const { sheet, updateSheetCell } = useDemoStore();
  const [selected, setSelected] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [draft, setDraft] = useState<string | null>(null);

  const cellValue = (row: number, col: number) =>
    sheet.cells.find((c) => c.row === row && c.col === col)?.value ?? '';

  const commit = () => {
    if (draft != null) {
      updateSheetCell(selected.row, selected.col, draft);
      setDraft(null);
    }
  };

  const startEdit = (row: number, col: number) => {
    setSelected({ row, col });
    setDraft(cellValue(row, col));
  };

  return (
    <div className="demo-google-sheets">
      <div className="demo-sheets-banner">{t('demo.interactiveDemo')}</div>
      <Card title={t('pages.googleSheets')}>
        <div className="demo-sheet-tabs" role="tablist" aria-label={sheet.name}>
          <button className="demo-sheet-tab active" role="tab" aria-selected="true">
            <Table2 size={14} aria-hidden="true" /> {sheet.name}
          </button>
          <button className="demo-sheet-tab" role="tab" aria-selected="false" disabled title={t('demo.mode')}>
            ＋ Q4_Forecast
          </button>
        </div>
        <div className="demo-sheet-container">
          <div className="demo-sheet-toolbar">
            <span className="demo-sheet-name">{sheet.name}</span>
            <span className="demo-sheet-status">● {t('demo.sheetsConnected')}</span>
          </div>
          <div className="demo-sheet-formula">
            <span className="demo-cell-ref">
              {SHEET_COLS[selected.col]}
              {selected.row + 1}
            </span>
            <input
              value={draft ?? cellValue(selected.row, selected.col)}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
              }}
              aria-label={t('common.edit')}
            />
          </div>
          <div className="demo-sheet-scroll">
            <div className="demo-sheet">
              <div className="demo-sheet-headers">
                <div className="demo-sheet-corner" aria-hidden="true" />
                {sheet.headers.map((header, col) => (
                  <div key={col} className="demo-sheet-header">
                    {SHEET_COLS[col]} · {header}
                  </div>
                ))}
              </div>
              {Array.from({ length: SHEET_ROWS }).map((_, row) => (
                <div key={row} className="demo-sheet-row">
                  <div className="demo-sheet-row-number">{row + 1}</div>
                  {sheet.headers.map((_header, col) => {
                    const isSel = selected.row === row && selected.col === col;
                    return (
                      <div
                        key={col}
                        className={`demo-sheet-cell${isSel ? ' selected' : ''}`}
                        onClick={() => startEdit(row, col)}
                        onKeyDown={(e) => e.key === 'Enter' && startEdit(row, col)}
                        tabIndex={0}
                        role="gridcell"
                        aria-selected={isSel}
                      >
                        {cellValue(row, col) || ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function DemoSettings() {
  const { t } = useTranslation();
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [dailyReports, setDailyReports] = useState(true);
  const { company, user } = useDemoStore();

  return (
    <div className="demo-settings">
      <Card title={t('pages.settings')}>
        <div className="demo-settings-section">
          <h3>{t('settings.workspace')}</h3>
          <div className="demo-settings-item">
            <span>{t('settings.activeCompany')}</span>
            <b>{company}</b>
          </div>
          <div className="demo-settings-item">
            <span>{t('settings.profile')}</span>
            <b>
              {user.name} · {user.role}
            </b>
          </div>
        </div>

        <div className="demo-settings-section">
          <h3>{t('demo.appearance')}</h3>
          <div className="demo-settings-item">
            <span>{t('settings.theme')}</span>
            <small className="demo-settings-note">
              {t('settings.themeLight')} / {t('settings.themeBlue')} — sidebar
            </small>
          </div>
          <div className="demo-settings-item">
            <span>{t('settings.language')}</span>
            <small className="demo-settings-note">
              {t('settings.languageId')} / {t('settings.languageEn')} — sidebar
            </small>
          </div>
        </div>

        <div className="demo-settings-section">
          <h3>{t('demo.notifications')}</h3>
          <div className="demo-settings-item">
            <span>{t('demo.lowStockNotifications')}</span>
            <Switch checked={lowStockAlerts} onChange={setLowStockAlerts} label={t('demo.lowStockNotifications')} />
          </div>
          <div className="demo-settings-item">
            <span>{t('demo.dailyReports')}</span>
            <Switch checked={dailyReports} onChange={setDailyReports} label={t('demo.dailyReports')} />
          </div>
        </div>
      </Card>
    </div>
  );
}

export function DemoHelp() {
  const { t } = useTranslation();
  const modules: [string, string][] = [
    [t('pages.pos'), t('demo.posDescription')],
    [t('pages.inventory'), t('demo.inventoryDescription')],
    [t('pages.sales'), t('help.items.sales')],
    [t('pages.shifts'), t('help.items.shifts')],
    [t('pages.purchases'), t('help.items.purchases')],
    [t('pages.reports'), t('demo.reportsDescription')],
    [t('pages.googleSheets'), t('demo.googleSheetsDescription')],
    [t('pages.settings'), t('help.items.settings')],
  ];
  return (
    <div className="demo-help">
      <Card title={t('pages.help')}>
        <div className="demo-help-content">
          <div>
            <h3>{t('demo.gettingStarted')}</h3>
            <p>{t('demo.gettingStartedText')}</p>
          </div>
          <div>
            <h3>{t('demo.modules')}</h3>
            <div className="demo-help-modules">
              {modules.map(([title, description]) => (
                <div className="demo-help-module" key={title}>
                  <h4>{title}</h4>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

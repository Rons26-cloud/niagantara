import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ApiError, api } from './api';
import { useAuth } from './auth/auth-context';
import {
  PosPage as Pos,
  SalesPage as Sales,
  ShiftPage as Shifts,
} from './phase3-pages';
import { CrudPage } from './phase4-pages';
import { AttendancePage, PurchasesPage } from './phase4-operations';
import { ExpensesPage, FinancePage, Phase4Summary } from './phase4-finance';
import { GoogleSheetsPage, SheetsTutorial } from './phase5-sheets';
type Ctx = {
  companies: any[];
  active_company: string | null;
  permissions: string[];
  stores: any[];
  accessible_branches: any[];
};
const nav = [
  ['dashboard', 'Dashboard'],
  ['pos', 'POS / Kasir'],
  ['sales', 'Sales'],
  ['shifts', 'Cashier Shift'],
  ['products', 'Products'],
  ['categories', 'Categories'],
  ['barcode', 'Barcode'],
  ['inventory', 'Inventory'],
  ['purchases', 'Purchases'],
  ['suppliers', 'Suppliers'],
  ['customers', 'Customers'],
  ['employees', 'Employees'],
  ['attendance', 'Attendance'],
  ['expenses', 'Expenses'],
  ['payables', 'Payables'],
  ['receivables', 'Receivables'],
  ['reports', 'Finance Reports'],
  ['sheets', 'Google Sheets'],
  ['warehouses', 'Warehouses'],
  ['branches', 'Branches'],
  ['stores', 'Store Management'],
  ['tutorial', 'Tutorial'],
  ['settings', 'Settings'],
] as const;
const navPermission: Record<string, string | undefined> = {
  pos: 'pos.access',
  sales: 'sale.read',
  shifts: 'shift.read',
  purchases: 'purchase.read',
  suppliers: 'supplier.read',
  customers: 'customer.read',
  employees: 'employee.read',
  attendance: 'attendance.read',
  expenses: 'expense.read',
  payables: 'payable.read',
  receivables: 'receivable.read',
  reports: 'finance.read',
  sheets: 'sheet.read',
};
export function DashboardApp() {
  const { accessToken, clearSession } = useAuth();
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [page, setPage] = useState(location.hash.slice(1) || 'dashboard');
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    if (!accessToken) return;
    api<Ctx>('/auth/me', accessToken)
      .then((v) => {
        setCtx(v);
        setStatus('ready');
      })
      .catch((e) =>
        setStatus(
          e instanceof ApiError && e.status === 403 ? 'denied' : 'error',
        ),
      );
  }, [accessToken]);
  if (!accessToken)
    return (
      <State
        text="Login diperlukan"
        action={() => location.assign('/auth/login')}
      />
    );
  if (status === 'loading')
    return <State text="Memuat konteks perusahaan..." />;
  if (status === 'denied') return <State text="Permission denied" />;
  if (status === 'error')
    return (
      <State
        text="Dashboard tidak dapat dimuat"
        action={() => location.reload()}
      />
    );
  if (!ctx?.active_company) return <State text="Belum ada perusahaan aktif" />;
  const branch = ctx.accessible_branches[0];
  const store =
    ctx.stores.find((s) => s.id === branch?.store_id) ?? ctx.stores[0];
  const go = (id: string) => {
    location.hash = id;
    setPage(id);
  };
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span>N</span>
          <div>
            NIAGANTARA<small>OPERATIONS</small>
          </div>
        </div>
        <nav>
          {nav
            .filter(
              ([id]) =>
                !navPermission[id] ||
                ctx.permissions.includes(navPermission[id]!),
            )
            .map(([id, label]) => (
              <button
                key={id}
                className={page === id ? 'active' : ''}
                onClick={() => go(id)}
              >
                {label}
              </button>
            ))}
        </nav>
        <button
          className="logout"
          onClick={() => {
            clearSession();
            location.assign('/auth/login');
          }}
        >
          Keluar
        </button>
      </aside>
      <main className="workspace">
        <header>
          <div>
            <p className="eyebrow">USER DASHBOARD</p>
            <h1>{nav.find((x) => x[0] === page)?.[1]}</h1>
          </div>
          <div className="context">
            <span>
              Company <b>{ctx.companies[0]?.company_id ?? '—'}</b>
            </span>
            <span>
              Store <b>{store?.name ?? 'Belum dipilih'}</b>
            </span>
            <span>
              Branch <b>{branch?.name ?? 'Semua branch berizin'}</b>
            </span>
          </div>
        </header>
        <Page page={page} ctx={ctx} token={accessToken} />
      </main>
    </div>
  );
}
function State({ text, action }: { text: string; action?: () => void }) {
  return (
    <main className="state">
      <div>
        <h1>{text}</h1>
        {action && <button onClick={action}>Coba lagi</button>}
      </div>
    </main>
  );
}
function Page({ page, ctx, token }: { page: string; ctx: Ctx; token: string }) {
  const c = ctx.active_company!;
  if (page === 'dashboard')
    return <Dashboard company={c} token={token} ctx={ctx} />;
  if (page === 'pos') return <Pos company={c} token={token} ctx={ctx} />;
  if (page === 'sales') return <Sales company={c} token={token} ctx={ctx} />;
  if (page === 'shifts') return <Shifts company={c} token={token} ctx={ctx} />;
  if (page === 'suppliers' || page === 'customers' || page === 'employees') return <CrudPage kind={page} company={c} token={token} ctx={ctx} />;
  if (page === 'purchases') return <PurchasesPage company={c} token={token} ctx={ctx} />;
  if (page === 'attendance') return <AttendancePage company={c} token={token} ctx={ctx} />;
  if (page === 'expenses') return <ExpensesPage company={c} token={token} ctx={ctx} />;
  if (page === 'payables' || page === 'receivables') return <FinancePage view={page} company={c} token={token} ctx={ctx} />;
  if (page === 'reports') return <FinancePage view="reports" company={c} token={token} ctx={ctx} />;
  if (page === 'sheets') return <GoogleSheetsPage company={c} token={token} canManage={ctx.permissions.includes('sheet.manage')} />;
  if (page === 'tutorial') return <SheetsTutorial />;
  if (page === 'products')
    return (
      <Resource
        title="Products"
        path="/products"
        company={c}
        token={token}
        fields={['name', 'sku', 'costPrice', 'sellingPrice']}
        allowed={ctx.permissions.includes('product.create')}
      />
    );
  if (page === 'categories')
    return (
      <Resource
        title="Categories"
        path="/categories"
        company={c}
        token={token}
        fields={['name', 'description']}
        allowed={ctx.permissions.includes('category.manage')}
      />
    );
  if (page === 'warehouses')
    return (
      <Resource
        title="Warehouses"
        path="/warehouses"
        company={c}
        token={token}
        fields={['name', 'code', 'storeId', 'branchId']}
        defaults={{
          storeId: ctx.stores[0]?.id ?? '',
          branchId: ctx.accessible_branches[0]?.id ?? '',
        }}
        allowed={ctx.permissions.includes('warehouse.manage')}
      />
    );
  if (page === 'stores')
    return (
      <Resource
        title="Stores"
        path="/stores"
        company={c}
        token={token}
        fields={['name']}
        allowed={ctx.permissions.includes('store.manage')}
      />
    );
  if (page === 'branches')
    return (
      <Resource
        title="Branches"
        path="/branches"
        company={c}
        token={token}
        fields={['name', 'code', 'storeId']}
        defaults={{ storeId: ctx.stores[0]?.id ?? '' }}
        allowed={ctx.permissions.includes('branch.manage')}
      />
    );
  if (page === 'inventory')
    return <Inventory company={c} token={token} ctx={ctx} />;
  if (page === 'barcode') return <Barcode company={c} token={token} />;
  return (
    <section className="panel empty">
      <h2>{page === 'tutorial' ? 'Tutorial' : 'Settings'}</h2>
      <p>
        Tidak ada data contoh. Modul ini belum memiliki konfigurasi Phase 2.
      </p>
    </section>
  );
}
function Dashboard({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const [sales, setSales] = useState<any[]>([]);
  const [low, setLow] = useState<any[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    Promise.all([
      api<any[]>(
        `/sales?from=${new Date().toISOString().slice(0, 10)}`,
        token,
        company,
      ),
      api<any[]>('/inventory/low-stock', token, company),
    ])
      .then(([s, l]) => {
        setSales(s);
        setLow(l);
      })
      .catch(() => setError(true));
  }, [company, token]);
  const paid = sales.filter((sale) =>
    ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(sale.status),
  );
  const revenue = paid.reduce(
    (sum, sale) =>
      sum + Number(sale.grand_total) - Number(sale.refunded_total ?? 0),
    0,
  );
  const topProducts = [
    ...paid
      .flatMap((sale) => sale.items ?? [])
      .reduce((map: Map<string, any>, item: any) => {
        const current = map.get(item.product_id) ?? {
          product: item.product_name,
          quantity: 0,
          revenue: 0,
        };
        current.quantity += Number(item.quantity);
        current.revenue += Number(item.line_total);
        map.set(item.product_id, current);
        return map;
      }, new Map())
      .values(),
  ]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  if (error)
    return (
      <section className="panel error">
        Data operasional tidak dapat dimuat.
      </section>
    );
  return (
    <>
      <Phase4Summary company={company} token={token} permissions={ctx.permissions} />
      <section className="metrics">
        <Metric
          label="Revenue hari ini"
          value={`Rp ${revenue.toLocaleString('id-ID')}`}
          note="Net paid sales"
        />
        <Metric
          label="Transactions today"
          value={String(paid.length)}
          note="Paid transactions"
        />
        <Metric
          label="Low stock"
          value={String(low.length)}
          note="quantity ≤ minimum"
        />
        <Metric
          label="Average transaction"
          value={`Rp ${(paid.length ? revenue / paid.length : 0).toLocaleString('id-ID')}`}
          note="Authorized scope"
        />
      </section>
      <section className="panel">
        <h2>Top products today</h2>
        {topProducts.length ? (
          <DataRows rows={topProducts} />
        ) : (
          <p className="muted">Belum ada produk terjual.</p>
        )}
      </section>
      <section className="panel">
        <h2>Recent sales</h2>
        {sales.length ? (
          <DataRows rows={sales.slice(0, 8)} />
        ) : (
          <p className="muted">Belum ada sales hari ini.</p>
        )}
      </section>
    </>
  );
}
function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
function Resource({
  title,
  path,
  company,
  token,
  fields,
  allowed,
  defaults = {},
}: {
  title: string;
  path: string;
  company: string;
  token: string;
  fields: string[];
  allowed: boolean;
  defaults?: Record<string, string>;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>(defaults);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const load = () =>
    api<any[]>(path, token, company)
      .then(setRows)
      .catch(() => setStatus('Data tidak dapat dimuat.'))
      .finally(() => setLoading(false));
  useEffect(() => {
    void load();
  }, [path, token, company]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus('Menyimpan...');
    try {
      await api(path, token, company, {
        method: 'POST',
        headers: { ...(form.branchId ? { 'x-branch-id': form.branchId } : {}) },
        body: JSON.stringify(form),
      });
      setForm(defaults);
      setStatus('Tersimpan.');
      load();
    } catch (e) {
      setStatus(
        e instanceof ApiError && e.status === 403
          ? 'Permission denied.'
          : 'Gagal menyimpan.',
      );
    }
  }
  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>{title}</h2>
          <span>{rows.length} item</span>
        </div>
        {loading ? (
          <p>Memuat...</p>
        ) : rows.length ? (
          <DataRows rows={rows} />
        ) : (
          <p className="muted">Belum ada data.</p>
        )}
      </section>
      {allowed ? (
        <section className="panel">
          <h2>Create {title}</h2>
          <form className="inline-form" onSubmit={submit}>
            {fields.map((f) => (
              <label key={f}>
                {f}
                <input
                  required={f !== 'description'}
                  type={f.toLowerCase().includes('price') ? 'number' : 'text'}
                  value={form[f] ?? ''}
                  onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                />
              </label>
            ))}
            <button>Simpan</button>
            <p>{status}</p>
          </form>
        </section>
      ) : (
        <section className="panel denied">
          Permission denied untuk membuat data.
        </section>
      )}
    </>
  );
}
function Inventory({
  company,
  token,
  ctx,
}: {
  company: string;
  token: string;
  ctx: Ctx;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [moves, setMoves] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    branchId: ctx.accessible_branches[0]?.id ?? '',
    warehouseId: '',
    productId: '',
    quantityDelta: '',
    minimumStock: '0',
    movementType: 'ADJUSTMENT',
  });
  const load = () =>
    Promise.all([
      api<any[]>('/inventory', token, company),
      api<any[]>('/inventory/movements', token, company),
    ])
      .then(([a, b]) => {
        setRows(a);
        setMoves(b);
      })
      .catch(() => setStatus('Inventory tidak dapat dimuat.'));
  useEffect(() => {
    void load();
  }, [company, token]);
  async function adjust(e: FormEvent) {
    e.preventDefault();
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
      setStatus('Stock dan movement tersimpan.');
      load();
    } catch {
      setStatus('Adjustment ditolak.');
    }
  }
  return (
    <>
      <section className="panel">
        <h2>Inventory per branch / warehouse</h2>
        {rows.length ? (
          <DataRows rows={rows} />
        ) : (
          <p className="muted">Belum ada inventory.</p>
        )}
      </section>
      {ctx.permissions.includes('inventory.adjust') && (
        <section className="panel">
          <h2>Stock adjustment</h2>
          <form className="inline-form" onSubmit={adjust}>
            {Object.keys(form).map((k) => (
              <label key={k}>
                {k}
                <input
                  value={(form as any)[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              </label>
            ))}
            <button>Simpan movement</button>
            <p>{status}</p>
          </form>
        </section>
      )}
      <section className="panel">
        <h2>Movement history</h2>
        {moves.length ? (
          <DataRows rows={moves} />
        ) : (
          <p className="muted">Belum ada movement.</p>
        )}
      </section>
    </>
  );
}
function Barcode({ company, token }: { company: string; token: string }) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  async function lookup(e: FormEvent) {
    e.preventDefault();
    try {
      setResult(
        await api(
          `/barcodes/lookup?code=${encodeURIComponent(code)}`,
          token,
          company,
        ),
      );
      setError('');
    } catch {
      setResult(null);
      setError('Barcode tidak ditemukan.');
    }
  }
  return (
    <section className="panel">
      <h2>Scan-ready lookup</h2>
      <form className="search" onSubmit={lookup}>
        <input
          placeholder="Barcode"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button>Cari</button>
      </form>
      {result && <DataRows rows={[result.product]} />}
      <p>{error}</p>
    </section>
  );
}
function DataRows({ rows }: { rows: any[] }) {
  const keys = useMemo(
    () =>
      Object.keys(rows[0] ?? {})
        .filter(
          (k) =>
            ![
              'description',
              'barcodes',
              'category',
              'product',
              'warehouse',
              'branch',
              'store',
            ].includes(k),
        )
        .slice(0, 6),
    [rows],
  );
  return (
    <div className="table">
      <div className="tr head">
        {keys.map((k) => (
          <span key={k}>{k}</span>
        ))}
      </div>
      {rows.map((r, i) => (
        <div className="tr" key={r.id ?? i}>
          {keys.map((k) => (
            <span key={k}>
              {typeof r[k] === 'boolean'
                ? r[k]
                  ? 'Yes'
                  : 'No'
                : String(r[k] ?? '—')}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

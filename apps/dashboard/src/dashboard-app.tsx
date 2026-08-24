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
import { ExpensesPage, FinancePage } from './phase4-finance';
import { GoogleSheetsPage, SheetsTutorial } from './phase5-sheets';
import {
  BrandLogo,
  BrandMark,
  ThemeSwitcher,
  LanguageSwitcher,
  useTranslation,
  Badge,
} from '@niagantara/ui';
import {
  DashboardHome,
  HelpPage,
  Onboarding,
  SettingsPage,
  TransferForm,
  loadStoredBranch,
  storeBranch,
  type OrgCtx,
} from './enhancements';
type Ctx = OrgCtx;
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
  ['help', 'Help'],
  ['settings', 'Settings'],
] as const;
const NAV_GROUPS: [string, string[]][] = [
  ['main', ['dashboard', 'pos']],
  ['catalog', ['products', 'categories', 'barcode', 'inventory']],
  ['sales', ['sales', 'shifts', 'customers']],
  ['purchasing', ['purchases', 'suppliers']],
  ['finance', ['expenses', 'payables', 'receivables', 'reports']],
  ['integration', ['sheets']],
  ['company', ['warehouses', 'branches', 'stores']],
  ['team', ['employees', 'attendance']],
];
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
  const { t } = useTranslation();
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
  const [branchId, setBranchId] = useState<string | null>(loadStoredBranch());
  const [page, setPage] = useState(location.hash.slice(1) || 'dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      api<Ctx>('/auth/me', accessToken),
      api<any[]>('/companies', accessToken).catch(() => []),
    ])
      .then(([me, companies]) => {
        setCtx(me);
        setCompanyNames(
          Object.fromEntries((companies ?? []).map((c: any) => [c.id, c.name])),
        );
        setStatus('ready');
      })
      .catch((e) =>
        setStatus(
          e instanceof ApiError && e.status === 403 ? 'denied' : 'error',
        ),
      );
  }, [accessToken]);
  useEffect(() => {
    const onHash = () => {
      setPage(location.hash.slice(1) || 'dashboard');
      setMenuOpen(false);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  if (!accessToken)
    return (
      <State
        text={t('auth.loginRequired')}
        action={() => location.assign('/auth/login')}
      />
    );
  if (status === 'loading')
    return <State text={t('dashboard.loadingContext')} />;
  if (status === 'denied') return <State text={t('dashboard.permissionDenied')} />;
  if (status === 'error')
    return (
      <State
        text={t('dashboard.loadError')}
        action={() => location.reload()}
      />
    );
  if (!ctx?.active_company) return <State text={t('dashboard.noCompany')} />;
  const selectedBranch =
    ctx.accessible_branches.find((b: any) => b.id === branchId) ??
    ctx.accessible_branches[0];
  const activeStore =
    ctx.stores.find((s: any) => s.id === selectedBranch?.store_id) ??
    ctx.stores[0];
  const scopedCtx: Ctx = {
    ...ctx,
    stores: activeStore ? [activeStore] : ctx.stores,
    accessible_branches: selectedBranch ? [selectedBranch] : ctx.accessible_branches,
  };
  const go = (id: string) => {
    location.hash = id;
    setPage(id);
    setMenuOpen(false);
  };
  const allowedNav = nav.filter(
    ([id]) =>
      !navPermission[id] || ctx.permissions.includes(navPermission[id]!),
  );
  const title = t(`pages.${page}`) !== `pages.${page}`
    ? t(`pages.${page}`)
    : nav.find((x) => x[0] === page)?.[1] ?? page;
  const primaryNav = ['dashboard', 'pos', 'sales', 'reports']
    .filter(
      (id) =>
        allowedNav.some(([navId]) => navId === id),
    )
    .slice(0, 4);
  const companyName = companyNames[ctx.active_company] ?? ctx.active_company;
  return (
    <div className={`shell${menuOpen ? ' nav-open' : ''}`}>
      <div className="mobile-topbar">
        <BrandMark size={30} />
        <div className="mobile-titles">
          <span className="mobile-page-title">{title}</span>
          <small className="mobile-brand-sub">{companyName}</small>
        </div>
        <button
          className="mobile-menu-btn"
          aria-expanded={menuOpen}
          aria-label={t('nav.menu')}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      {menuOpen && (
        <button
          className="drawer-overlay"
          aria-label={t('common.close')}
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className="sidebar">
        <div className="brand brand-chip">
          <BrandLogo className="sidebar-brand-full" />
          <BrandMark size={32} className="sidebar-brand-collapsed" />
        </div>
        <nav>
          {NAV_GROUPS.map(([group, ids]) => {
            const items = ids
              .map((id) => allowedNav.find(([navId]) => navId === id))
              .filter((x): x is (typeof allowedNav)[number] => !!x);
            if (!items.length) return null;
            return (
              <div className="nav-group" key={group}>
                <span className="nav-group-label">{t(`dashboard.navGroups.${group}`)}</span>
                {items.map(([id, label]) => (
                  <button
                    key={id}
                    className={page === id ? 'active' : ''}
                    aria-current={page === id ? 'page' : undefined}
                    onClick={() => go(id)}
                  >
                    {t(`pages.${id}`) || label}
                  </button>
                ))}
              </div>
            );
          })}
          {['settings', 'help']
            .map((id) => allowedNav.find(([navId]) => navId === id))
            .filter((x): x is (typeof allowedNav)[number] => !!x)
            .map(([id, label]) => (
              <button
                key={id}
                className={page === id ? 'active' : ''}
                aria-current={page === id ? 'page' : undefined}
                onClick={() => go(id)}
              >
                {t(`pages.${id}`) || label}
              </button>
            ))}
        </nav>
        <div className="sidebar-controls">
          <ThemeSwitcher />
          <LanguageSwitcher compact />
        </div>
        <button
          className="logout"
          onClick={() => {
            clearSession();
            location.assign('/auth/login');
          }}
        >
          {t('auth.logout')}
        </button>
      </aside>
      <main className="workspace">
        <header>
          <div>
            <p className="eyebrow">USER DASHBOARD</p>
            <h1>{title}</h1>
          </div>
          <div className="context context--switchable">
            <span className="ctx-company" title={companyName}>
              {t('context.company')} <b>{companyName}</b>
            </span>
            {ctx.stores.length > 0 && (
              <label className="ctx-select">
                {t('context.store')}
                <select
                  value={activeStore?.id ?? ''}
                  onChange={(e) => {
                    const storeBranches = ctx.accessible_branches.filter(
                      (b: any) => b.store_id === e.target.value,
                    );
                    setBranchId(storeBranches[0]?.id ?? '');
                    storeBranch(storeBranches[0]?.id ?? '');
                  }}
                >
                  {ctx.stores.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {ctx.accessible_branches.length > 0 && (
              <label className="ctx-select">
                {t('context.branch')}
                <select
                  value={selectedBranch?.id ?? ''}
                  onChange={(e) => {
                    setBranchId(e.target.value);
                    storeBranch(e.target.value);
                  }}
                >
                  {ctx.accessible_branches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </header>
        <Page
          page={page}
          ctx={scopedCtx}
          token={accessToken}
          companyName={companyName}
          title={title}
        />
      </main>
      <nav className="mobile-tabbar" aria-label={t('nav.primary')}>
        {primaryNav.map((id) => (
          <button
            key={id}
            className={page === id ? 'active' : ''}
            aria-current={page === id ? 'page' : undefined}
            onClick={() => go(id)}
          >
            {t(`pages.${id}`)}
          </button>
        ))}
        <button
          className={menuOpen ? 'active' : ''}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? t('common.close') : t('nav.more')}
        </button>
      </nav>
    </div>
  );
}
function State({ text, action }: { text: string; action?: () => void }) {
  const { t } = useTranslation();
  return (
    <main className="state">
      <div>
        <h1>{text}</h1>
        {action && <button onClick={action}>{t('dashboard.tryAgain')}</button>}
      </div>
    </main>
  );
}
function Page({
  page,
  ctx,
  token,
  companyName,
  title,
}: {
  page: string;
  ctx: Ctx;
  token: string;
  companyName: string;
  title: string;
}) {
  const { t } = useTranslation();
  const c = ctx.active_company!;
  const branch = ctx.accessible_branches[0];
  if (page === 'dashboard')
    return (
      <>
        {ctx.stores.length === 0 && ctx.accessible_branches.length === 0 && (
          <Onboarding ctx={ctx} go={(p) => go2(p)} />
        )}
        <DashboardHome
          company={c}
          token={token}
          ctx={ctx}
          branch={branch}
          go={go2}
        />
      </>
    );
  function go2(id: string) {
    location.hash = id;
  }
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
  if (page === 'help') return <HelpPage />;
  if (page === 'settings')
    return <SettingsPage ctx={ctx} companyName={companyName} />;
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
      <h2>{title}</h2>
      <p className="muted">{t('messages.loadError')}</p>
    </section>
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
  const [warehouses, setWarehouses] = useState<any[]>([]);
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
      api<any[]>('/warehouses', token, company).catch(() => []),
    ])
      .then(([a, b, w]) => {
        setRows(a);
        setMoves(b);
        setWarehouses(w);
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
      {ctx.permissions.includes('inventory.transfer') && warehouses.length > 1 && (
        <TransferForm
          company={company}
          token={token}
          warehouses={warehouses}
          onDone={load}
        />
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

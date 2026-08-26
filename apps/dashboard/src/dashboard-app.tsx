import { useEffect, useState } from 'react';
import { ApiError, api } from './api';
import { useAuth } from './auth/auth-context';
import { PosPage as Pos } from './phase3-pages';
import { CrudPage } from './phase4-pages';
import { GoogleSheetsPage, SheetsTutorial } from './phase5-sheets';
import {
  BrandLogo,
  BrandMark,
  ThemeSwitcher,
  LanguageSwitcher,
  useTranslation,
  SidebarIcon,
  USER_NAV_ICONS,
} from '@niagantara/ui';
import {
  Building2,
  CircleHelp,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import {
  DashboardHome,
  Onboarding,
  loadStoredBranch,
  storeBranch,
  type OrgCtx,
} from './enhancements';
import { ProductsPage } from './pages/products';
import { CategoriesPage } from './pages/categories';
import { BarcodePage } from './pages/barcode';
import { InventoryPage } from './pages/inventory';
import { CustomersPage } from './pages/customers';
import { SuppliersPage } from './pages/suppliers';
import { WarehousesPage } from './pages/warehouses';
import { BranchesPage } from './pages/branches';
import { StoresPage } from './pages/stores';
import { ShiftPage } from './pages/shifts';
import { SalesPage } from './pages/sales';
import { PurchasesPage as PurchasesPageNew } from './pages/purchases';
import { ExpensesPage as ExpensesPageNew } from './pages/expenses';
import { FinancePage as FinancePageNew } from './pages/finance';
import { AttendancePage as AttendancePageNew } from './pages/attendance';
import { UsersPage as UsersPageNew } from './pages/users';
import { SettingsPage as SettingsPageNew } from './pages/settings';
import { HelpPage as HelpPageNew } from './pages/help';
import { RealtimeProvider, useRealtime } from './realtime';

type Ctx = OrgCtx;

const nav = [
  ['dashboard', 'Beranda'],
  ['pos', 'POS / Kasir'],
  ['products', 'Produk'],
  ['categories', 'Kategori'],
  ['barcode', 'Barcode'],
  ['inventory', 'Stok'],
  ['sales', 'Penjualan'],
  ['shifts', 'Shift Kasir'],
  ['customers', 'Pelanggan'],
  ['purchases', 'Pembelian'],
  ['suppliers', 'Supplier'],
  ['expenses', 'Pengeluaran'],
  ['payables', 'Hutang'],
  ['receivables', 'Piutang'],
  ['reports', 'Laporan Keuangan'],
  ['sheets', 'Google Sheets'],
  ['warehouses', 'Gudang'],
  ['branches', 'Cabang'],
  ['stores', 'Manajemen Toko'],
  ['employees', 'Karyawan'],
  ['attendance', 'Absensi'],
  ['users', 'Pengguna'],
  ['settings', 'Pengaturan'],
  ['help', 'Bantuan'],
] as const;

const NAV_GROUPS: [string, string[]][] = [
  ['main', ['dashboard', 'pos']],
  ['catalog', ['products', 'categories', 'barcode', 'inventory']],
  ['sales', ['sales', 'shifts', 'customers']],
  ['purchasing', ['purchases', 'suppliers']],
  ['finance', ['expenses', 'payables', 'receivables', 'reports']],
  ['integration', ['sheets']],
  ['company', ['warehouses', 'branches', 'stores']],
  ['team', ['employees', 'attendance', 'users']],
  ['account', ['settings', 'help']],
];

const navPermission: Record<string, string | undefined> = {
  products: 'product.read',
  categories: 'category.read',
  barcode: 'barcode.read',
  inventory: 'inventory.read',
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
  users: 'user.read',
  warehouses: 'warehouse.read',
  branches: 'branch.read',
  stores: 'store.read',
};

export function DashboardApp() {
  const { accessToken, clearSession } = useAuth();
  const { t } = useTranslation();
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
  const [branchId, setBranchId] = useState<string | null>(loadStoredBranch());
  const [page, setPage] = useState(location.hash.slice(1) || 'dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [status, setStatus] = useState('loading');
  const [badges, setBadges] = useState<Record<string, number>>({});

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
        loadBadges(me.active_company, accessToken);
      })
      .catch((e) =>
        setStatus(
          e instanceof ApiError && e.status === 403 ? 'denied' : 'error',
        ),
      );
  }, [accessToken]);

  function loadBadges(companyId: string, token: string) {
    if (!companyId) return;
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      api<any[]>('/employees', token, companyId).catch(() => []),
      api<any[]>('/attendance', token, companyId).catch(() => []),
      api<any[]>('/users', token, companyId).catch(() => []),
      api<any[]>(`/sales?from=${today}&to=${today}`, token, companyId).catch(() => []),
      api<any[]>('/inventory/low-stock', token, companyId).catch(() => []),
    ]).then(([employees, attendance, users, todaySales, lowStock]) => {
      const todayAttendance = Array.isArray(attendance)
        ? attendance.filter((r: any) => r.clock_in_at?.slice(0, 10) === today)
        : [];
      const present = todayAttendance.filter((r: any) => r.status === 'PRESENT' || r.status === 'LATE').length;
      setBadges({
        employees: Array.isArray(employees) ? employees.length : 0,
        attendance: present,
        users: Array.isArray(users) ? users.length : 0,
        sales: Array.isArray(todaySales) ? todaySales.length : 0,
        'low-stock': Array.isArray(lowStock) ? lowStock.length : 0,
      });
    });
  }

  useEffect(() => {
    const onHash = () => {
      setPage(location.hash.slice(1) || 'dashboard');
      setMenuOpen(false);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  if (!accessToken)
    return (
      <State
        text={t('auth.loginRequired')}
        action={() => location.assign('/auth/login')}
      />
    );
  if (status === 'loading')
    return <State text={t('dashboard.loadingContext')} />;
  if (status === 'denied')
    return <State text={t('dashboard.permissionDenied')} />;
  if (status === 'error')
    return (
      <State text={t('dashboard.loadError')} action={() => location.reload()} />
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
    accessible_branches: selectedBranch
      ? [selectedBranch]
      : ctx.accessible_branches,
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
  const visibleNav = allowedNav.filter(([id, label]) =>
    `${id} ${label}`.toLowerCase().includes(navSearch.trim().toLowerCase()),
  );

  const title =
    t(`pages.${page}`) !== `pages.${page}`
      ? t(`pages.${page}`)
      : (nav.find((x) => x[0] === page)?.[1] ?? page);

  const primaryNav = ['dashboard', 'pos', 'sales', 'reports']
    .filter((id) => allowedNav.some(([navId]) => navId === id))
    .slice(0, 4);

  const companyName = companyNames[ctx.active_company] ?? ctx.active_company;
  const profileName =
    ctx.profile?.full_name ??
    ctx.profile?.name ??
    ctx.profile?.email ??
    'Owner';
  const profileRole = ctx.roles[0] ?? 'owner';
  const profileInitials = String(profileName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <RealtimeProvider
      token={accessToken}
      companyId={ctx.active_company}
      branchId={selectedBranch?.id}
    >
      <div
        className={`shell${menuOpen ? ' nav-open' : ''}${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}
      >
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

        <div className="mobile-contextbar">
          <label>
            <span>{t('context.store')}</span>
            <select
              value={activeStore?.id ?? ''}
              onChange={(event) => {
                const storeBranches = ctx.accessible_branches.filter(
                  (branch: any) => branch.store_id === event.target.value,
                );
                const nextBranch = storeBranches[0]?.id ?? '';
                setBranchId(nextBranch);
                storeBranch(nextBranch);
              }}
            >
              {ctx.stores.map((store: any) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('context.branch')}</span>
            <select
              value={selectedBranch?.id ?? ''}
              onChange={(event) => {
                setBranchId(event.target.value);
                storeBranch(event.target.value);
              }}
            >
              {ctx.accessible_branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {menuOpen && (
          <button
            className="drawer-overlay"
            aria-label={t('common.close')}
            onClick={() => setMenuOpen(false)}
          />
        )}

        <aside className="sidebar">
          <div className="sidebar-brand-row">
            <div className="brand sidebar-brand">
              <BrandLogo className="sidebar-brand-full" />
              <BrandMark size={32} className="sidebar-brand-collapsed" />
            </div>
            <button
              className="sidebar-collapse"
              type="button"
              aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
              aria-pressed={sidebarCollapsed}
              onClick={() => setSidebarCollapsed((value) => !value)}
            >
              {sidebarCollapsed ? '›' : '‹'}
            </button>
          </div>
          <div className="sidebar-workspace-card">
            <span className="sidebar-workspace-icon" aria-hidden="true">
              <Building2 size={17} />
            </span>
            <span className="sidebar-workspace-copy">
              <small>{t('context.company')}</small>
              <b title={companyName}>{companyName}</b>
            </span>
            <ShieldCheck size={15} aria-label="Tenant aman" />
          </div>
          <label className="nav-search">
            <span className="sr-only">Cari menu</span>
            <input
              value={navSearch}
              onChange={(event) => setNavSearch(event.target.value)}
              placeholder="Cari menu"
            />
          </label>
          <nav>
            {NAV_GROUPS.map(([group, ids]) => {
              const items = ids
                .map((id) => visibleNav.find(([navId]) => navId === id))
                .filter((x): x is (typeof allowedNav)[number] => !!x);
              if (!items.length) return null;
              return (
                <div className="nav-group" key={group}>
                  <span className="nav-group-label">
                    <span>{t(`dashboard.navGroups.${group}`)}</span>
                    <small>{items.length}</small>
                  </span>
                  {items.map(([id, label]) => {
                    const Icon = USER_NAV_ICONS[id];
                    const badgeCount = badges[id];
                    return (
                      <button
                        key={id}
                        className={page === id ? 'active' : ''}
                        aria-current={page === id ? 'page' : undefined}
                        onClick={() => go(id)}
                      >
                        {Icon && <SidebarIcon icon={Icon} size={18} />}
                        <span>{t(`pages.${id}`) || label}</span>
                        {badgeCount != null && badgeCount > 0 && !sidebarCollapsed && (
                          <span className="nav-badge">{badgeCount}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
          <div className="sidebar-controls">
            <ThemeSwitcher />
            <LanguageSwitcher compact />
          </div>
          <div className="sidebar-account">
            <span className="sidebar-account-avatar" aria-hidden="true">
              {profileInitials || 'OW'}
            </span>
            <span className="sidebar-account-copy">
              <b>{profileName}</b>
              <small>{profileRole.replaceAll('_', ' ')}</small>
            </span>
          </div>
          <button
            className="logout"
            onClick={() => {
              clearSession();
              location.assign('/auth/login');
            }}
          >
            <LogOut size={16} />
            <span>{t('auth.logout')}</span>
          </button>
        </aside>

        <main className="workspace">
          <header>
            <RealtimeIndicator />
            <div>
              <p className="eyebrow">
                <span>OWNER WORKSPACE</span>
                {selectedBranch?.name && (
                  <span className="header-location">
                    <MapPin size={12} aria-hidden="true" />{' '}
                    {selectedBranch.name}
                  </span>
                )}
              </p>
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
              <button
                className="header-action"
                type="button"
                onClick={() => go('help')}
                aria-label="Bantuan"
              >
                <CircleHelp size={17} aria-hidden="true" />
              </button>
              <button
                className="header-action"
                type="button"
                onClick={() => go('settings')}
                aria-label="Pengaturan"
              >
                <Settings size={17} aria-hidden="true" />
              </button>
            </div>
          </header>
          <RealtimePage
            page={page}
            ctx={scopedCtx}
            token={accessToken}
            companyName={companyName}
            title={title}
          />
        </main>

        <nav className="mobile-tabbar" aria-label={t('nav.primary')}>
          {primaryNav.map((id) => {
            const Icon = USER_NAV_ICONS[id];
            return (
              <button
                key={id}
                className={page === id ? 'active' : ''}
                aria-current={page === id ? 'page' : undefined}
                onClick={() => go(id)}
              >
                {Icon && <Icon size={20} strokeWidth={2} aria-hidden="true" />}
                <span>{t(`pages.${id}`)}</span>
              </button>
            );
          })}
          <button
            className={menuOpen ? 'active' : ''}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? t('common.close') : t('nav.more')}
          </button>
        </nav>
      </div>
    </RealtimeProvider>
  );
}

function RealtimeIndicator() {
  const { status } = useRealtime();
  const label =
    status === 'connected'
      ? 'Realtime aktif'
      : status === 'connecting' || status === 'reconnecting'
        ? 'Menghubungkan...'
        : status === 'error'
          ? 'Realtime offline'
          : '';
  if (!label) return null;
  return (
    <span
      className={`realtime-status realtime-status--${status}`}
      role="status"
    >
      {label}
    </span>
  );
}

function RealtimePage(props: {
  page: string;
  ctx: Ctx;
  token: string;
  companyName: string;
  title: string;
}) {
  const { revision } = useRealtime();
  return <Page key={`${props.page}:${revision}`} {...props} />;
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

  function go2(id: string) {
    location.hash = id;
  }

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
  if (page === 'pos') return <Pos company={c} token={token} ctx={ctx} />;
  if (page === 'sales')
    return <SalesPage company={c} token={token} ctx={ctx} />;
  if (page === 'shifts')
    return <ShiftPage company={c} token={token} ctx={ctx} />;
  if (page === 'suppliers')
    return <SuppliersPage company={c} token={token} ctx={ctx} />;
  if (page === 'customers')
    return <CustomersPage company={c} token={token} ctx={ctx} />;
  if (page === 'employees')
    return <CrudPage kind="employees" company={c} token={token} ctx={ctx} />;
  if (page === 'purchases')
    return <PurchasesPageNew company={c} token={token} ctx={ctx} />;
  if (page === 'attendance')
    return <AttendancePageNew company={c} token={token} ctx={ctx} />;
  if (page === 'expenses')
    return <ExpensesPageNew company={c} token={token} ctx={ctx} />;
  if (page === 'payables' || page === 'receivables')
    return <FinancePageNew view={page} company={c} token={token} ctx={ctx} />;
  if (page === 'reports')
    return (
      <FinancePageNew view="reports" company={c} token={token} ctx={ctx} />
    );
  if (page === 'sheets')
    return (
      <GoogleSheetsPage
        company={c}
        token={token}
        canManage={ctx.permissions.includes('sheet.manage')}
      />
    );
  if (page === 'users')
    return <UsersPageNew company={c} token={token} ctx={ctx} />;
  if (page === 'help') return <HelpPageNew />;
  if (page === 'settings')
    return (
      <SettingsPageNew ctx={ctx} companyName={companyName} token={token} />
    );
  if (page === 'tutorial') return <SheetsTutorial />;
  if (page === 'products')
    return <ProductsPage company={c} token={token} ctx={ctx} />;
  if (page === 'categories')
    return <CategoriesPage company={c} token={token} ctx={ctx} />;
  if (page === 'warehouses')
    return <WarehousesPage company={c} token={token} ctx={ctx} />;
  if (page === 'stores')
    return <StoresPage company={c} token={token} ctx={ctx} />;
  if (page === 'branches')
    return <BranchesPage company={c} token={token} ctx={ctx} />;
  if (page === 'inventory')
    return <InventoryPage company={c} token={token} ctx={ctx} />;
  if (page === 'barcode')
    return <BarcodePage company={c} token={token} ctx={ctx} />;

  return (
    <section className="panel empty">
      <h2>{title}</h2>
      <p className="muted">{t('messages.loadError')}</p>
    </section>
  );
}

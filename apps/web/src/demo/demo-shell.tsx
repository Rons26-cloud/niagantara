import { useEffect, useRef, useState } from 'react';
import {
  BrandLogo,
  BrandMark,
  ThemeSwitcher,
  LanguageSwitcher,
  useTranslation,
  SidebarIcon,
  USER_NAV_ICONS,
} from '@niagantara/ui';
import { Search, Bell, LogOut } from 'lucide-react';
import { useDemoStore } from './demo-store';
import { Link, navigate } from '../router';

const navItems = [
  ['dashboard', 'Dashboard'],
  ['pos', 'POS / Kasir'],
  ['sales', 'Sales'],
  ['shifts', 'Cashier Shift'],
  ['products', 'Products'],
  ['categories', 'Categories'],
  ['inventory', 'Inventory'],
  ['warehouses', 'Warehouses'],
  ['stock-transfer', 'Stock Transfer'],
  ['customers', 'Customers'],
  ['suppliers', 'Suppliers'],
  ['purchases', 'Purchases'],
  ['employees', 'Employees'],
  ['attendance', 'Attendance'],
  ['expenses', 'Expenses'],
  ['finance', 'Finance'],
  ['reports', 'Reports'],
  ['google-sheets', 'Google Sheets'],
  ['branches', 'Branches'],
  ['stores', 'Stores'],
  ['settings', 'Settings'],
  ['help', 'Help'],
] as const;

type NavId = (typeof navItems)[number][0];

const PAGE_KEYS: Partial<Record<NavId, string>> = {
  'stock-transfer': 'pages.stockTransfer',
  'google-sheets': 'pages.googleSheets',
};

const NAV_GROUPS: [string, NavId[]][] = [
  ['main', ['dashboard', 'pos']],
  ['catalog', ['products', 'categories', 'inventory']],
  ['sales', ['sales', 'shifts', 'customers']],
  ['purchasing', ['purchases', 'suppliers']],
  ['finance', ['expenses', 'finance', 'reports']],
  ['integration', ['google-sheets']],
  ['company', ['warehouses', 'stock-transfer', 'branches', 'stores']],
  ['team', ['employees', 'attendance']],
];

const PRIMARY_NAV: NavId[] = ['dashboard', 'pos', 'sales', 'reports'];

function pageTitle(id: string, label: string, t: (k: string) => string): string {
  const key = PAGE_KEYS[id as NavId] ?? `pages.${id}`;
  const translated = t(key);
  return translated === key ? label : translated;
}

export function DemoShell({
  children,
  currentPage,
}: {
  children: React.ReactNode;
  currentPage: string;
}) {
  const { t } = useTranslation();
  const {
    company,
    user,
    branches,
    stores,
    selectedBranch,
    selectedStore,
    setSelectedBranch,
    setSelectedStore,
    resetDemo,
    sales,
    products,
  } = useDemoStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!notifOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [notifOpen]);

  const selectedBranchData =
    branches.find((b) => b.id === selectedBranch) ?? branches[0];
  const selectedStoreData =
    stores.find((s) => s.id === selectedStore) ?? stores[0];

  const fallbackLabel =
    navItems.find(([id]) => id === currentPage)?.[1] ?? currentPage;
  const title = pageTitle(currentPage, fallbackLabel, t);

  const lowStock = products.filter((p) => p.stock <= p.minimumStock).length;
  const recentSales = sales.filter((s) => s.id.startsWith('demo-')).length;
  const notifications = [
    ...lowStock > 0
      ? [
          {
            id: 'low-stock',
            title: t('dashboard.lowStock'),
            detail: `${lowStock} ${t('demo.lowStockNotifications').toLowerCase()}`,
          },
        ]
      : [],
    ...recentSales > 0
      ? [
          {
            id: 'sales',
            title: t('dashboard.recentActivity'),
            detail: `${recentSales}× ${t('common.payment')}`,
          },
        ]
      : [],
    {
      id: 'sheets',
      title: t('demo.googleSheetsStatus'),
      detail: `${t('demo.lastSync')}: ${t('demo.sheetsConnected')}`,
    },
  ];

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const goSearch = (query: string) => {
    if (query.trim()) navigate('/demo/products');
  };

  const sidebarItem = (id: NavId, label: string) => {
    const iconKey = id === 'google-sheets' ? 'sheets' : id === 'stock-transfer' ? 'stock-transfer' : id;
    const Icon = USER_NAV_ICONS[iconKey] ?? USER_NAV_ICONS[id];
    return (
      <Link
        key={id}
        to={`/demo/${id}`}
        className={currentPage === id ? 'active' : ''}
        aria-current={currentPage === id ? 'page' : undefined}
        onClick={() => setMenuOpen(false)}
      >
        {Icon && <SidebarIcon icon={Icon} size={18} />}
        <span>{pageTitle(id, label, t)}</span>
      </Link>
    );
  };

  return (
    <div className={`demo-shell${menuOpen ? ' nav-open' : ''}`}>
      <div className="demo-banner" role="status">
        <span className="demo-badge">{t('demo.mode')}</span>
        <span className="demo-text">{t('demo.sampleData')}</span>
        <button className="demo-reset" onClick={resetDemo}>
          ↻ {t('demo.reset')}
        </button>
      </div>

      <div className="demo-mobile-topbar">
        <button
          ref={closeButtonRef}
          className="demo-mobile-menu-btn"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? t('common.close') : t('nav.menu')}
          aria-controls="demo-sidebar"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
        </button>
        <BrandMark size={28} />
        <div className="demo-mobile-titles">
          <span className="demo-mobile-page-title">{title}</span>
          <small className="demo-mobile-brand-sub">{company}</small>
        </div>
      </div>

      {menuOpen && (
        <button
          className="demo-drawer-overlay"
          aria-label={t('common.close')}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside id="demo-sidebar" className="demo-sidebar" aria-label={t('nav.primary')}>
        <div className="demo-brand">
          <BrandLogo className="demo-sidebar-brand-full" />
          <BrandMark size={32} className="demo-sidebar-brand-collapsed" />
        </div>
        <nav>
          {NAV_GROUPS.map(([group, ids]) => (
            <div className="demo-nav-group" key={group}>
              <span className="demo-nav-group-label">
                {t(`dashboard.navGroups.${group}`)}
              </span>
              {ids.map((id) => {
                const item = navItems.find(([navId]) => navId === id);
                return item ? sidebarItem(item[0], item[1]) : null;
              })}
            </div>
          ))}
          <div className="demo-nav-group">
            {(['settings', 'help'] as NavId[]).map((id) => {
              const item = navItems.find(([navId]) => navId === id);
              return item ? sidebarItem(item[0], item[1]) : null;
            })}
          </div>
        </nav>
        <div className="demo-sidebar-controls">
          <ThemeSwitcher />
          <LanguageSwitcher compact />
        </div>
        <div className="demo-sidebar-user">
          <span className="demo-user-avatar" aria-hidden="true">
            {initials}
          </span>
          <div className="demo-user-meta">
            <span className="demo-user-name">{user.name}</span>
            <span className="demo-user-role">{user.role}</span>
          </div>
        </div>
      </aside>

      <main className="demo-workspace">
        <header className="demo-topbar">
          <div>
            <p className="eyebrow">USER DASHBOARD</p>
            <h1>{title}</h1>
          </div>

          <div className="demo-context" aria-label={t('context.company')}>
            <span className="demo-ctx-company" title={company}>
              {t('context.company')}
              <b>{company}</b>
            </span>
            {selectedStoreData && (
              <label className="demo-ctx-select">
                {t('context.store')}
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {selectedBranchData && (
              <label className="demo-ctx-select">
                {t('context.branch')}
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="demo-topbar-tools">
            <form
              className="demo-topbar-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                goSearch((e.currentTarget.elements.namedItem('q') as HTMLInputElement)?.value ?? '');
              }}
            >
              <Search size={15} aria-hidden="true" />
              <input name="q" type="search" placeholder={`${t('common.search')}…`} aria-label={t('common.search')} />
            </form>

            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                className="demo-icon-btn"
                aria-haspopup="true"
                aria-expanded={notifOpen}
                aria-label={t('demo.notifications')}
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell size={16} aria-hidden="true" />
                <span className="demo-dot" aria-hidden="true" />
              </button>
              {notifOpen && (
                <div className="demo-pop" role="menu" aria-label={t('demo.notifications')}>
                  <div className="demo-pop-head">{t('demo.notifications')}</div>
                  {notifications.map((n) => (
                    <div className="demo-pop-item" key={n.id} role="menuitem">
                      <b>{n.title}</b>
                      <small>{n.detail}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <span className="demo-profile-chip" title={`${user.name} — ${user.role}`}>
              <span className="demo-user-avatar" aria-hidden="true">
                {initials}
              </span>
              <span className="demo-profile-meta">
                <b>{user.name}</b>
                <small>{user.role}</small>
              </span>
            </span>
          </div>
        </header>
        {children}
      </main>

      <nav className="demo-mobile-tabbar" aria-label={t('nav.primary')}>
        {PRIMARY_NAV.map((id) => {
          const item = navItems.find(([navId]) => navId === id);
          if (!item) return null;
          const Icon = USER_NAV_ICONS[id];
          return (
            <Link
              key={id}
              to={`/demo/${id}`}
              className={currentPage === id ? 'active' : ''}
              aria-current={currentPage === id ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {Icon && <Icon size={20} strokeWidth={2} aria-hidden="true" />}
              <span>{pageTitle(id, item[1], t)}</span>
            </Link>
          );
        })}
        <button
          className={menuOpen ? 'active' : ''}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? t('common.close') : t('nav.more')}
        </button>
      </nav>
    </div>
  );
}

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from '@niagantara/ui';

export const SITE_URL = 'https://niagantara.com';

const NavigateContext = createContext<(to: string) => void>(() => {});
export const NavigateProvider = NavigateContext.Provider;

export function usePath(): string {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export function navigate(to: string): void {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function Link({
  to,
  children,
  className,
  ariaLabel,
  ariaCurrent,
  onClick,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaCurrent?: 'page';
  onClick?: () => void;
}) {
  const go = useContext(NavigateContext);
  return (
    <a
      href={to}
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onClick?.();
        go(to);
      }}
    >
      {children}
    </a>
  );
}

const routeTitles: Record<string, string> = {
  '/': 'NIAGANTARA — Business Control Platform',
  '/fitur': 'Fitur',
  '/solusi': 'Solusi',
  '/harga': 'Harga',
  '/tentang': 'Tentang',
  '/faq': 'FAQ',
  '/kontak': 'Kontak',
  '/privacy': 'Kebijakan Privasi',
  '/terms': 'Syarat & Ketentuan',
  '/demo': 'NIAGANTARA — Demo Interaktif',
  '/demo/dashboard': 'Dashboard — Demo',
  '/demo/pos': 'POS — Demo',
  '/demo/products': 'Products — Demo',
  '/demo/categories': 'Categories — Demo',
  '/demo/inventory': 'Inventory — Demo',
  '/demo/stock-transfer': 'Stock Transfer — Demo',
  '/demo/sales': 'Sales — Demo',
  '/demo/shifts': 'Shifts — Demo',
  '/demo/customers': 'Customers — Demo',
  '/demo/suppliers': 'Suppliers — Demo',
  '/demo/purchases': 'Purchases — Demo',
  '/demo/employees': 'Employees — Demo',
  '/demo/attendance': 'Attendance — Demo',
  '/demo/expenses': 'Expenses — Demo',
  '/demo/finance': 'Finance — Demo',
  '/demo/reports': 'Reports — Demo',
  '/demo/google-sheets': 'Google Sheets — Demo',
  '/demo/warehouses': 'Warehouses — Demo',
  '/demo/branches': 'Branches — Demo',
  '/demo/stores': 'Stores — Demo',
  '/demo/settings': 'Settings — Demo',
  '/demo/help': 'Help — Demo',
};

/** Keeps document title + canonical URL in sync with the active route. */
export function Seo({ path }: { path: string }) {
  const { t } = useTranslation();
  useEffect(() => {
    const suffix = routeTitles[path];
    if (!suffix) return;
    const isHome = path === '/';
    document.title = isHome ? suffix : `${t(`nav.${path.slice(1)}` as never)} — NIAGANTARA`;
    const url = `${SITE_URL}${path}`;
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = url;
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = document.title;
    const twTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twTitle) twTitle.content = document.title;
  }, [path, t]);
  return null;
}

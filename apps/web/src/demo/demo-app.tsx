import { useEffect } from 'react';
import { ToastViewport, useTranslation } from '@niagantara/ui';
import { DemoStoreProvider } from './demo-store';
import { DemoShell } from './demo-shell';
import { DemoDashboard } from './demo-dashboard';
import { DemoProducts } from './demo-products';
import {
  DemoPOS,
  DemoSales,
  DemoInventory,
  DemoStockTransfer,
  DemoCategories,
  DemoShifts,
  DemoCustomers,
  DemoSuppliers,
  DemoPurchases,
  DemoEmployees,
  DemoAttendance,
  DemoExpenses,
  DemoFinance,
  DemoReports,
  DemoGoogleSheets,
  DemoWarehouses,
  DemoBranches,
  DemoStores,
  DemoSettings,
  DemoHelp,
} from './demo-pages';
import { usePath } from '../router';
import './demo-styles.css';

const DEMO_PAGES = [
  'dashboard',
  'pos',
  'sales',
  'shifts',
  'products',
  'categories',
  'barcode',
  'inventory',
  'warehouses',
  'stock-transfer',
  'customers',
  'suppliers',
  'purchases',
  'employees',
  'users',
  'attendance',
  'expenses',
  'finance',
  'payables',
  'receivables',
  'reports',
  'google-sheets',
  'branches',
  'stores',
  'settings',
  'help',
] as const;

type DemoPage = (typeof DEMO_PAGES)[number];

function readDemoPage(path: string): DemoPage {
  if (path.startsWith('/demo/')) {
    const page = path.replace('/demo/', '').replace(/\/+$/, '');
    if ((DEMO_PAGES as readonly string[]).includes(page))
      return page as DemoPage;
  }
  return 'dashboard';
}

function DemoPageContent({ currentPage }: { currentPage: DemoPage }) {
  switch (currentPage) {
    case 'products':
    case 'barcode':
      return <DemoProducts />;
    case 'pos':
      return <DemoPOS />;
    case 'sales':
      return <DemoSales />;
    case 'inventory':
      return <DemoInventory />;
    case 'stock-transfer':
      return <DemoStockTransfer />;
    case 'categories':
      return <DemoCategories />;
    case 'shifts':
      return <DemoShifts />;
    case 'customers':
      return <DemoCustomers />;
    case 'suppliers':
      return <DemoSuppliers />;
    case 'purchases':
      return <DemoPurchases />;
    case 'employees':
    case 'users':
      return <DemoEmployees />;
    case 'attendance':
      return <DemoAttendance />;
    case 'expenses':
      return <DemoExpenses />;
    case 'finance':
    case 'payables':
    case 'receivables':
      return <DemoFinance />;
    case 'reports':
      return <DemoReports />;
    case 'google-sheets':
      return <DemoGoogleSheets />;
    case 'warehouses':
      return <DemoWarehouses />;
    case 'branches':
      return <DemoBranches />;
    case 'stores':
      return <DemoStores />;
    case 'settings':
      return <DemoSettings />;
    case 'help':
      return <DemoHelp />;
    default:
      return <DemoDashboard />;
  }
}

export function DemoApp() {
  const path = usePath();
  const { t } = useTranslation();
  const currentPage = readDemoPage(path);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <DemoStoreProvider>
      <div role="application" aria-label={t('demo.mode')}>
        <DemoShell currentPage={currentPage}>
          <DemoPageContent currentPage={currentPage} />
        </DemoShell>
        <ToastViewport />
      </div>
    </DemoStoreProvider>
  );
}

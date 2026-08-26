import type { ComponentType } from 'react';
import {
  Home,
  MonitorSmartphone,
  Package,
  Tags,
  ScanLine,
  Boxes,
  ReceiptText,
  ShoppingBag,
  Clock3,
  Users,
  Truck,
  CircleDollarSign,
  HandCoins,
  BadgeDollarSign,
  BarChart3,
  Table2,
  Warehouse,
  GitBranch,
  Store,
  UserRoundCog,
  CalendarCheck,
  UsersRound,
  Settings,
  CircleHelp,
  LayoutDashboard,
  Building2,
  LogOut,
  Table,
} from 'lucide-react';

export type { NavIcon } from './feature-icons';
export { FEATURE_ICONS, SidebarIcon } from './feature-icons';

type IconType = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

/* ─── User Dashboard ─── */

export const USER_NAV_ICONS: Record<string, IconType> = {
  dashboard: Home,
  pos: MonitorSmartphone,
  sales: ReceiptText,
  shifts: Clock3,
  products: Package,
  categories: Tags,
  barcode: ScanLine,
  inventory: Boxes,
  purchases: ShoppingBag,
  suppliers: Truck,
  customers: Users,
  employees: UserRoundCog,
  attendance: CalendarCheck,
  expenses: CircleDollarSign,
  payables: HandCoins,
  receivables: BadgeDollarSign,
  reports: BarChart3,
  sheets: Table,
  warehouses: Warehouse,
  branches: GitBranch,
  stores: Store,
  users: UsersRound,
  settings: Settings,
  help: CircleHelp,
};

/* ─── Master Dashboard ─── */

export const MASTER_NAV_ICONS: Record<string, IconType> = {
  dashboard: LayoutDashboard,
  companies: Building2,
  users: Users,
};

/* ─── Mobile Bottom Nav Icons ─── */

export const MOBILE_BOTTOM_NAV = [
  { id: 'dashboard', icon: Home, label: 'Beranda' },
  { id: 'pos', icon: MonitorSmartphone, label: 'POS' },
  { id: 'sales', icon: ReceiptText, label: 'Penjualan' },
  { id: 'reports', icon: BarChart3, label: 'Laporan' },
] as const;

/* ─── POS Nav Icons ─── */

export const POS_NAV_ICONS: Record<string, IconType> = {
  pos: ScanLine,
  transactions: ReceiptText,
  history: ReceiptText,
  products: Package,
  customers: Users,
  shifts: Clock3,
  settings: Settings,
};

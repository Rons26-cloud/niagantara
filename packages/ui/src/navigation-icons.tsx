import type { ComponentType } from 'react';
import {
  Home,
  MonitorSmartphone,
  Package,
  Tags,
  Boxes,
  ArrowLeftRight,
  ReceiptText,
  ShoppingBag,
  BarChart3,
  Users,
  Truck,
  WalletCards,
  Table2,
  GitBranch,
  Store,
  UserRoundCog,
  UserCog,
  CreditCard,
  Settings,
  CircleHelp,
  Info,
  LogOut,
  LayoutDashboard,
  Building2,
  ScrollText,
  Activity,
  ToggleLeft,
  Rocket,
  Wrench,
  Megaphone,
  Smartphone,
  HeartPulse,
  PackageCheck,
  Bell,
  Plus,
  Search,
  ScanLine,
  History,
  Clock3,
} from 'lucide-react';

export type { NavIcon } from './feature-icons';
export { FEATURE_ICONS, SidebarIcon } from './feature-icons';

/* ─── User Dashboard ─── */

export const USER_NAV_ICONS: Record<string, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  dashboard: Home,
  pos: MonitorSmartphone,
  sales: ShoppingBag,
  shifts: Clock3,
  products: Package,
  categories: Tags,
  barcode: ScanLine,
  inventory: Boxes,
  purchases: ShoppingBag,
  suppliers: Truck,
  customers: Users,
  employees: UserRoundCog,
  attendance: UserRoundCog,
  expenses: WalletCards,
  payables: WalletCards,
  receivables: WalletCards,
  reports: BarChart3,
  sheets: Table2,
  warehouses: Boxes,
  branches: GitBranch,
  stores: Store,
  settings: Settings,
  help: CircleHelp,
  'stock-transfer': ArrowLeftRight,
  finance: WalletCards,
  'google-sheets': Table2,
};

/* ─── Master Dashboard ─── */

export const MASTER_NAV_ICONS: Record<string, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  dashboard: LayoutDashboard,
  companies: Building2,
  users: Users,
  subscription: CreditCard,
  billing: ReceiptText,
  'system-health': HeartPulse,
  releases: PackageCheck,
  versions: GitBranch,
  'feature-flags': ToggleLeft,
  rollout: Rocket,
  maintenance: Wrench,
  announcements: Megaphone,
  'mobile-versions': Smartphone,
  security: ScrollText,
  operations: Activity,
};

/* ─── Mobile Bottom Nav Icons ─── */

export const MOBILE_BOTTOM_NAV = [
  { id: 'home', icon: Home, label: 'Beranda' },
  { id: 'sales', icon: ReceiptText, label: 'Transaksi' },
  { id: 'add', icon: Plus, label: 'Tambah' },
  { id: 'notifications', icon: Bell, label: 'Notifikasi' },
  { id: 'account', icon: UserCog, label: 'Akun' },
] as const;

/* ─── POS Nav Icons ─── */

export const POS_NAV_ICONS: Record<string, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  pos: ScanLine,
  transactions: ReceiptText,
  history: History,
  products: Package,
  customers: Users,
  shifts: Clock3,
  settings: Settings,
};

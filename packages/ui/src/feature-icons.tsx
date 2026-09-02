import type { ComponentType } from 'react';
import {
  MonitorSmartphone,
  Package,
  ShoppingBag,
  WalletCards,
  Users,
  Truck,
  UserRoundCog,
  GitBranch,
  BarChart3,
  Table2,
} from 'lucide-react';

export type NavIcon = ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
}>;

export const FEATURE_ICONS: NavIcon[] = [
  MonitorSmartphone,
  Package,
  ShoppingBag,
  WalletCards,
  Users,
  Truck,
  UserRoundCog,
  GitBranch,
  BarChart3,
  Table2,
];

export function SidebarIcon({
  icon: Icon,
  size = 18,
  strokeWidth = 2,
}: {
  icon: NavIcon;
  size?: number;
  strokeWidth?: number;
}) {
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class DashboardRangeDto {
  @IsDateString() @IsOptional() from?: string;
  @IsDateString() @IsOptional() to?: string;
  @IsUUID() @IsOptional() branchId?: string;
}

export interface DashboardKpis {
  revenue: number;
  transactions: number;
  averageOrderValue: number;
  productsSold: number;
  lowStockCount: number;
  expenses: number | null;
  grossProfit: number | null;
  netProfit: number | null;
  receivables: number | null;
  payables: number | null;
}
export type MetricAvailability = 'supported' | 'unavailable' | 'new_period_activity';
export interface MetricComparison { current: number; previous: number; delta: number; changePercent: number | null; availability: MetricAvailability; }
export interface PaymentDistribution { method: string; transactionCount: number; amount: number; percentage: number; }
export interface CommandCenterResponse { summary: { accessibleBranches: number; activeShifts: number; criticalStock: number; warningStock: number; integrationFailures: number | null; pendingSync: number | null }; branchHealth: BranchPerformance[]; activeShifts: Array<{ shiftId: string; branchId: string; openedAt?: string; openingCash?: number }>; stockAlerts: Array<{ branchId: string; currentStock: number; minimumStock: number; severity: 'CRITICAL' | 'LOW' }>; integrations: Array<{ type: string; status: string; lastSyncAt?: string | null }>; operationalAlerts: Array<{ id: string; type: string; severity: string; title: string; branchId?: string }>; activity: Array<{ id: string; action: string; resourceType: string; branchId?: string; createdAt: string }>; availability: { integrationHealth: boolean; activityFeed: boolean; posPresence: boolean }; updatedAt: string; }

export interface DashboardPoint { bucket: string; revenue: number; transactions: number; }
export interface BranchPerformance { branchId: string; branchName: string; revenue: number; transactions: number; averageOrderValue: number; productsSold: number; lowStockCount: number; activeShiftCount: number; }
export interface DashboardOverview { period: { from: string; to: string; timezone: string; preset?: string }; previousPeriod: { from: string; to: string }; kpis: DashboardKpis; comparison: Record<'revenue' | 'transactions' | 'averageOrderValue' | 'productsSold' | 'lowStockCount', MetricComparison>; salesTrend: DashboardPoint[]; topProducts: Array<{ productId: string; productName: string; quantity: number; revenue: number }>; paymentDistribution: PaymentDistribution[] | null; availability: { grossProfit: boolean; expenses: boolean; receivables: boolean; payables: boolean; paymentDistribution: boolean }; branchPerformance: BranchPerformance[]; updatedAt: string; }

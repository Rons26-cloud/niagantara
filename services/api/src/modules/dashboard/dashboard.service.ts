import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import { comparisonMetric } from './dashboard.helpers.js';
import type {
  BranchPerformance,
  DashboardKpis,
  DashboardOverview,
  DashboardPoint,
  PaymentDistribution,
} from './dashboard.dto.js';
import { normalizeSheetsStatus } from './integration-status.js';

type SaleRow = {
  id: string;
  branch_id: string;
  grand_total: number;
  refunded_total?: number;
  created_at: string;
  items?: {
    quantity: number;
    product_id?: string;
    product_name?: string;
    line_total?: number;
  }[];
  payment?: { method?: string; amount?: number; status?: string }[];
};
type InventoryRow = {
  branch_id: string;
  quantity: number;
  minimum_stock?: number | null;
};
const VALID = ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'];
const iso = (value: Date) => value.toISOString().slice(0, 10);

@Injectable()
export class DashboardService {
  constructor(private readonly db: SupabaseService) {}

  private range(from?: string, to?: string) {
    const end = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
    const start = from
      ? new Date(`${from}T00:00:00.000Z`)
      : new Date(end.getTime() - 6 * 86400000);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    )
      throw new BadRequestException({
        code: 'INVALID_DATE_RANGE',
        message: 'Invalid date range.',
      });
    const days = Math.max(
      1,
      Math.floor((end.getTime() - start.getTime()) / 86400000) + 1,
    );
    return {
      start,
      end,
      previousStart: new Date(start.getTime() - days * 86400000),
      previousEnd: new Date(start.getTime() - 1),
    };
  }

  private async sales(
    company: string,
    start: Date,
    end: Date,
    branches?: string[],
    branchId?: string,
  ): Promise<SaleRow[]> {
    const exclusiveEnd = new Date(end.getTime() + 1);
    let query = this.db.client
      .from('sales')
      .select(
        'id,branch_id,grand_total,refunded_total,created_at,items:sale_items(quantity,product_id,product_name,line_total),payment:payments(method,amount,status)',
      )
      .eq('company_id', company)
      .in('status', VALID)
      .gte('created_at', start.toISOString())
      .lt('created_at', exclusiveEnd.toISOString())
      .limit(5000);
    if (branchId) query = query.eq('branch_id', branchId);
    else if (branches) query = query.in('branch_id', branches);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as SaleRow[];
  }

  private metrics(rows: SaleRow[], lowStockCount = 0): DashboardKpis {
    const revenue = rows.reduce(
      (sum, row) =>
        sum + Number(row.grand_total) - Number(row.refunded_total ?? 0),
      0,
    );
    return {
      revenue,
      transactions: rows.length,
      averageOrderValue: rows.length ? revenue / rows.length : 0,
      productsSold: rows.reduce(
        (sum, row) =>
          sum +
          (row.items ?? []).reduce((n, item) => n + Number(item.quantity), 0),
        0,
      ),
      lowStockCount,
      expenses: null,
      grossProfit: null,
      netProfit: null,
      receivables: null,
      payables: null,
    };
  }

  async overview(
    company: string,
    query: { from?: string; to?: string; branchId?: string },
    authz: { companyRole: string; branchIds: string[] },
  ): Promise<DashboardOverview> {
    const { start, end, previousStart, previousEnd } = this.range(
      query.from,
      query.to,
    );
    const companyWide = ['owner', 'company_admin'].includes(authz.companyRole);
    const selectedBranch =
      query.branchId ?? (companyWide ? undefined : authz.branchIds[0]);
    if (!companyWide && !selectedBranch)
      throw new BadRequestException({
        code: 'BRANCH_CONTEXT_REQUIRED',
        message: 'A branch context is required.',
      });
    if (
      selectedBranch &&
      !authz.branchIds.includes(selectedBranch) &&
      !companyWide
    )
      throw new BadRequestException({
        code: 'BRANCH_ACCESS_DENIED',
        message: 'Branch is outside your scope.',
      });
    const allowedBranches = companyWide ? undefined : authz.branchIds;
    const [rows, previous, low, branchResult, shiftResult] = await Promise.all([
      this.sales(company, start, end, allowedBranches, selectedBranch),
      this.sales(
        company,
        previousStart,
        previousEnd,
        allowedBranches,
        selectedBranch,
      ),
      this.db.client
        .from('inventory')
        .select('branch_id,quantity,minimum_stock')
        .eq('company_id', company)
        .limit(10000),
      (() => {
        let q = this.db.client
          .from('branches')
          .select('id,name')
          .eq('company_id', company);
        if (allowedBranches) q = q.in('id', allowedBranches);
        if (selectedBranch) q = q.eq('id', selectedBranch);
        return q;
      })(),
      (() => {
        let q = this.db.client
          .from('cashier_shifts')
          .select('id,branch_id')
          .eq('company_id', company)
          .eq('status', 'OPEN');
        if (allowedBranches) q = q.in('branch_id', allowedBranches);
        if (selectedBranch) q = q.eq('branch_id', selectedBranch);
        return q;
      })(),
    ]);
    if (low.error) throw low.error;
    if (branchResult.error) throw branchResult.error;
    if (shiftResult.error) throw shiftResult.error;
    const lowRows = (low.data ?? []) as InventoryRow[];
    const lowByBranch = new Map<string, number>();
    for (const item of lowRows)
      if (Number(item.quantity) <= Number(item.minimum_stock ?? 0))
        lowByBranch.set(
          item.branch_id,
          (lowByBranch.get(item.branch_id) ?? 0) + 1,
        );
    const shiftsByBranch = new Map<string, number>();
    for (const shift of shiftResult.data ?? [])
      shiftsByBranch.set(
        shift.branch_id,
        (shiftsByBranch.get(shift.branch_id) ?? 0) + 1,
      );
    const branchRows: BranchPerformance[] = [];
    for (const branch of branchResult.data ?? []) {
      const id = branch.id;
      const scoped = rows.filter((row) => row.branch_id === id);
      const kpi = this.metrics(scoped);
      branchRows.push({
        branchId: id,
        branchName: branch.name ?? id,
        revenue: kpi.revenue,
        transactions: kpi.transactions,
        averageOrderValue: kpi.averageOrderValue,
        productsSold: kpi.productsSold,
        lowStockCount: lowByBranch.get(id) ?? 0,
        activeShiftCount: shiftsByBranch.get(id) ?? 0,
      });
    }
    const trendMap = new Map<string, DashboardPoint>();
    for (const row of rows) {
      const bucket = iso(new Date(row.created_at));
      const point = trendMap.get(bucket) ?? {
        bucket,
        revenue: 0,
        transactions: 0,
      };
      point.revenue +=
        Number(row.grand_total) - Number(row.refunded_total ?? 0);
      point.transactions += 1;
      trendMap.set(bucket, point);
    }
    const current = this.metrics(
      rows,
      [...lowByBranch.values()].reduce((sum, count) => sum + count, 0),
    );
    const prior = this.metrics(previous);
    const paymentMap = new Map<
      string,
      { transactionCount: number; amount: number }
    >();
    for (const row of rows)
      for (const payment of row.payment ?? []) {
        if (!payment.method) continue;
        const entry = paymentMap.get(payment.method) ?? {
          transactionCount: 0,
          amount: 0,
        };
        entry.transactionCount += 1;
        entry.amount += Number(payment.amount ?? 0);
        paymentMap.set(payment.method, entry);
      }
    const paymentTotal = [...paymentMap.values()].reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const paymentDistribution: PaymentDistribution[] | null = paymentMap.size
      ? [...paymentMap.entries()].map(([method, item]) => ({
          method,
          ...item,
          percentage: paymentTotal ? (item.amount / paymentTotal) * 100 : 0,
        }))
      : null;
    const comparison = {
      revenue: comparisonMetric(current.revenue, prior.revenue),
      transactions: comparisonMetric(current.transactions, prior.transactions),
      averageOrderValue: comparisonMetric(
        current.averageOrderValue,
        prior.averageOrderValue,
      ),
      productsSold: comparisonMetric(current.productsSold, prior.productsSold),
      lowStockCount: comparisonMetric(
        current.lowStockCount,
        prior.lowStockCount,
      ),
    };
    return {
      period: {
        from: iso(start),
        to: iso(end),
        timezone: 'UTC (business timezone not configured)',
      },
      previousPeriod: { from: iso(previousStart), to: iso(previousEnd) },
      kpis: current,
      comparison,
      salesTrend: [...trendMap.values()].sort((a, b) =>
        a.bucket.localeCompare(b.bucket),
      ),
      topProducts: [],
      paymentDistribution,
      availability: {
        grossProfit: false,
        expenses: false,
        receivables: false,
        payables: false,
        paymentDistribution: paymentDistribution !== null,
      },
      branchPerformance: branchRows,
      updatedAt: new Date().toISOString(),
    };
  }

  async commandCenter(
    company: string,
    query: { from?: string; to?: string; branchId?: string },
    authz: { companyRole: string; branchIds: string[] },
  ) {
    const overview = await this.overview(company, query, authz);
    const stockAlerts = overview.branchPerformance
      .filter((branch) => branch.lowStockCount > 0)
      .map((branch) => ({
        branchId: branch.branchId,
        currentStock: 0,
        minimumStock: 0,
        severity: 'LOW' as const,
      }));
    const allowed = ['owner', 'company_admin'].includes(authz.companyRole)
      ? undefined
      : authz.branchIds;
    let auditQuery = this.db.client
      .from('audit_logs')
      .select('id,action,resource_type,branch_id,created_at')
      .eq('company_id', company)
      .order('created_at', { ascending: false })
      .limit(30);
    if (allowed) auditQuery = auditQuery.in('branch_id', allowed);
    let shiftQuery = this.db.client
      .from('cashier_shifts')
      .select(
        'id,company_id,branch_id,cashier_id,opened_at,opening_cash,status,branch:branches(name),cashier:profiles(full_name)',
      )
      .eq('company_id', company)
      .eq('status', 'OPEN')
      .order('opened_at', { ascending: true })
      .limit(50);
    if (allowed) shiftQuery = shiftQuery.in('branch_id', allowed);
    const [audit, sheets, shifts, history] = await Promise.all([
      auditQuery,
      this.db.client
        .from('google_connections')
        .select('status,updated_at')
        .eq('company_id', company)
        .maybeSingle(),
      shiftQuery,
      this.db.client
        .from('sheet_sync_history')
        .select('outcome,finished_at,error_code,error_message')
        .eq('company_id', company)
        .order('finished_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    const integrations = [
      {
        type: 'google_sheets',
        status: normalizeSheetsStatus(sheets.data, null, history.data),
        lastSyncAt: history.data?.finished_at ?? null,
      },
    ];
    const activity = (audit.data ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      resourceType: row.resource_type,
      branchId: row.branch_id ?? undefined,
      createdAt: row.created_at,
    }));
    const activeRaw = (shifts.data ?? []) as unknown as Array<{
      id: string;
      company_id: string;
      branch_id: string;
      cashier_id: string;
      opened_at: string;
      opening_cash: number;
      status: string;
      branch?: { name?: string } | { name?: string }[];
      cashier?: { full_name?: string } | { full_name?: string }[];
    }>;
    const shiftIds = activeRaw.map((shift) => shift.id);
    const salesResult = shiftIds.length
      ? await this.db.client
          .from('sales')
          .select('shift_id,grand_total,refunded_total')
          .eq('company_id', company)
          .in('shift_id', shiftIds)
          .in('status', VALID)
          .limit(5000)
      : { data: [], error: null };
    if (salesResult.error) throw salesResult.error;
    const salesByShift = new Map<string, { count: number; amount: number }>();
    for (const sale of salesResult.data ?? []) {
      const current = salesByShift.get(sale.shift_id) ?? {
        count: 0,
        amount: 0,
      };
      current.count += 1;
      current.amount +=
        Number(sale.grand_total) - Number(sale.refunded_total ?? 0);
      salesByShift.set(sale.shift_id, current);
    }
    const activeShifts = activeRaw.map((shift) => {
      const branch = Array.isArray(shift.branch)
        ? shift.branch[0]
        : shift.branch;
      const cashier = Array.isArray(shift.cashier)
        ? shift.cashier[0]
        : shift.cashier;
      const sales = salesByShift.get(shift.id) ?? { count: 0, amount: 0 };
      return {
        shiftId: shift.id,
        companyId: shift.company_id,
        branchId: shift.branch_id,
        branchName: branch?.name ?? null,
        cashierUserId: shift.cashier_id,
        cashierName: cashier?.full_name ?? null,
        openedAt: shift.opened_at,
        openingCash: Number(shift.opening_cash),
        salesCount: sales.count,
        salesAmount: sales.amount,
        durationSeconds: Math.max(
          0,
          Math.floor((Date.now() - new Date(shift.opened_at).getTime()) / 1000),
        ),
        status: shift.status,
      };
    });
    return {
      summary: {
        accessibleBranches: overview.branchPerformance.length,
        activeShifts: activeShifts.length,
        criticalStock: 0,
        warningStock: stockAlerts.length,
        integrationFailures: null,
        pendingSync: null,
      },
      branchHealth: overview.branchPerformance,
      activeShifts,
      stockAlerts,
      integrations,
      operationalAlerts: [],
      activity,
      availability: {
        integrationHealth: Boolean(sheets.data),
        activityFeed: !audit.error,
        posPresence: false,
      },
      updatedAt: overview.updatedAt,
    };
  }
}

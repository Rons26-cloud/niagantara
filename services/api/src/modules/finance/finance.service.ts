import { BadRequestException, Injectable } from '@nestjs/common';
import { FinanceRepository } from './finance.repository.js';
import type { FinanceQuery, PaymentInput } from './dto/finance.dto.js';
import type { FinancialReport } from './financial-report.model.js';
import { exportPdf, exportXlsx, reportFilename } from './financial-report.exporter.js';
import { AuditService } from '../audit/audit.service.js';
@Injectable()
export class FinanceService {
  constructor(private readonly repo: FinanceRepository, private readonly audit?: AuditService) {}
  async payables(c: string, authz?: { companyRole?: string; branchIds?: string[] }) {
    const { data, error } = await this.repo.payables(c);
    if (error) throw error;
    if (['owner', 'company_admin'].includes(authz?.companyRole ?? '')) return data ?? [];
    const allowed = new Set(authz?.branchIds ?? []);
    return (data ?? []).filter((row: any) => allowed.has(row.purchase?.branch_id));
  }
  async receivables(c: string, authz?: { companyRole?: string; branchIds?: string[] }) {
    const { data, error } = await this.repo.receivables(c);
    if (error) throw error;
    if (['owner', 'company_admin'].includes(authz?.companyRole ?? '')) return data ?? [];
    const allowed = new Set(authz?.branchIds ?? []);
    return (data ?? []).filter((row: any) => allowed.has(row.sale?.branch_id));
  }
  private validate(d: PaymentInput) {
    if (!Number.isFinite(d.amount) || d.amount <= 0 || !d.idempotencyKey)
      throw new BadRequestException({
        code: 'INVALID_PAYMENT',
        message: 'Positive amount and idempotency key are required.',
      });
  }
  async payable(c: string, u: string, id: string, d: PaymentInput) {
    this.validate(d);
    const { data, error } = await this.repo.payPayable(c, u, id, d);
    if (error) throw error;
    return data;
  }
  async receivable(c: string, u: string, id: string, d: PaymentInput) {
    this.validate(d);
    const { data, error } = await this.repo.payReceivable(c, u, id, d);
    if (error) throw error;
    return data;
  }
  async report(
    c: string,
    f: FinanceQuery,
    authz?: { companyRole?: string; branchIds?: string[] },
  ) {
    if (f.from || f.to) {
      const start = f.from ? Date.parse(`${f.from}T00:00:00Z`) : Number.NEGATIVE_INFINITY;
      const end = f.to ? Date.parse(`${f.to}T23:59:59.999Z`) : Number.POSITIVE_INFINITY;
      if ((f.from && !Number.isFinite(start)) || (f.to && !Number.isFinite(end)) || end < start || end - start > 366 * 86400000) {
        throw new BadRequestException({ code: 'FINANCE_RANGE_TOO_LARGE', message: 'Finance report range must be between 1 and 366 days.' });
      }
    }
    const companyWide = ['owner', 'company_admin'].includes(
      authz?.companyRole ?? '',
    );
    const branchIds = companyWide ? undefined : authz?.branchIds ?? [];
    if (f.branchId && branchIds && !branchIds.includes(f.branchId)) {
      throw new BadRequestException({
        code: 'BRANCH_ACCESS_DENIED',
        message: 'Branch is outside your scope.',
      });
    }
    const result: any = await this.repo.report(c, f, branchIds);
    const legacyLedger = Array.isArray(result?.data) ? result.data : [];
    const normalized = {
      ledger: result?.ledger ?? legacyLedger,
      ledgerError: result?.ledgerError ?? result?.error ?? null,
      sales: result?.sales ?? [],
      salesError: result?.salesError ?? null,
      expenses: result?.expenses ?? [],
      expensesError: result?.expensesError ?? null,
      payables: result?.payables ?? [],
      payablesError: result?.payablesError ?? null,
      receivables: result?.receivables ?? [],
      receivablesError: result?.receivablesError ?? null,
    };
    const firstError = normalized.ledgerError ?? normalized.salesError ?? normalized.expensesError ?? normalized.payablesError ?? normalized.receivablesError;
    if (firstError) throw firstError;
    const rows: any[] = normalized.ledger;
    const sales: any[] = normalized.sales;
    const expenseRows: any[] = normalized.expenses;
    const payableRows: any[] = normalized.payables;
    const receivableRows: any[] = normalized.receivables;
    if (sales.length >= 5000 || expenseRows.length >= 5000 || payableRows.length >= 5000 || receivableRows.length >= 5000) {
      throw new BadRequestException({ code: 'REPORT_TOO_LARGE', message: 'Laporan terlalu besar. Persempit periode atau cabang.' });
    }
    const total = (type: string, dir: string) =>
      rows
        .filter((x: any) => x.event_type === type && x.direction === dir)
        .reduce((n: number, x: any) => n + Number(x.amount), 0);
    const revenue = sales.length
      ? sales.reduce(
          (n: number, sale: any) => n + Number(sale.grand_total ?? 0) - Number(sale.refunded_total ?? 0),
          0,
        )
      : total('SALE_INCOME', 'IN');
    const refunds = sales.length
      ? sales.reduce((n: number, sale: any) => n + Number(sale.refunded_total ?? 0), 0)
      : total('REFUND', 'OUT');
    const expenses = expenseRows.length
      ? expenseRows.reduce((n: number, row: any) => n + Number(row.amount ?? 0), 0)
      : total('EXPENSE', 'OUT');
    const purchases = total('PAYABLE_PAYMENT', 'OUT');
    const saleCash = sales.reduce((n: number, sale: any) => {
      const payments = Array.isArray(sale.payment) ? sale.payment : sale.payment ? [sale.payment] : [];
      return n + payments
        .filter((payment: any) => ['RECORDED', 'PARTIALLY_REFUNDED'].includes(payment.status))
        .reduce((sum: number, payment: any) => sum + Number(payment.amount ?? 0), 0);
    }, 0);
    const receivableCollections = total('RECEIVABLE_PAYMENT', 'IN');
    const cashReceived = (sales.length ? saleCash : total('SALE_INCOME', 'IN')) + receivableCollections;
    const cashOutflow = expenses + purchases + refunds;
    const outstandingReceivables = receivableRows.reduce((n: number, row: any) => n + Number(row.remaining_amount ?? 0), 0);
    const outstandingPayables = payableRows.reduce((n: number, row: any) => n + Number(row.remaining_amount ?? 0), 0);
    const branchMap = new Map<string, { revenue: number; expenses: number; transactions: number }>();
    for (const sale of sales) {
      const key = sale.branch_id ?? 'unassigned';
      const current = branchMap.get(key) ?? { revenue: 0, expenses: 0, transactions: 0 };
      current.revenue += Number(sale.grand_total ?? 0) - Number(sale.refunded_total ?? 0);
      current.transactions += 1;
      branchMap.set(key, current);
    }
    for (const expense of expenseRows) {
      const key = expense.branch_id ?? 'unassigned';
      const current = branchMap.get(key) ?? { revenue: 0, expenses: 0, transactions: 0 };
      current.expenses += Number(expense.amount ?? 0);
      branchMap.set(key, current);
    }
    const report: FinancialReport = {
      metadata: {
        companyId: c,
        companyName: null,
        branchId: f.branchId ?? null,
        periodStart: f.from ?? null,
        periodEnd: f.to ?? null,
        generatedAt: new Date().toISOString(),
        generatedBy: null,
        currency: 'IDR',
        timezone: 'UTC (business timezone not configured)',
      },
      filters: { from: f.from, to: f.to, branchId: f.branchId, storeId: f.storeId },
      summary: {
        netSales: revenue,
        recordedExpenses: expenses,
        cashReceived,
        cashOutflow,
        netCashFlow: cashReceived - cashOutflow,
        receivablesOutstanding: outstandingReceivables,
        receivablesOverdue: receivableRows.filter((row: any) => row.status === 'OVERDUE').reduce((n: number, row: any) => n + Number(row.remaining_amount ?? 0), 0),
        payablesOutstanding: outstandingPayables,
        payablesOverdue: payableRows.filter((row: any) => row.status === 'OVERDUE').reduce((n: number, row: any) => n + Number(row.remaining_amount ?? 0), 0),
        transactionCount: sales.length,
      },
      label: 'Operating cash summary from recorded sales, expenses, and settlements (not audited accounting profit)',
      revenue,
      expenses,
      purchases,
      refunds,
      cashReceived,
      cashOutflow,
      operatingCashResult: cashReceived - cashOutflow,
      transactions: rows,
      revenueRows: sales,
      expenseRows,
      receivables: {
        rows: receivableRows,
        outstanding: outstandingReceivables,
        overdue: receivableRows.filter((row: any) => row.status === 'OVERDUE').reduce((n: number, row: any) => n + Number(row.remaining_amount ?? 0), 0),
      },
      payables: {
        rows: payableRows,
        outstanding: outstandingPayables,
        overdue: payableRows.filter((row: any) => row.status === 'OVERDUE').reduce((n: number, row: any) => n + Number(row.remaining_amount ?? 0), 0),
      },
      branchAnalysis: [...branchMap.entries()].map(([branchId, values]) => ({ branchId, ...values })),
      profitLoss: { supported: false, reason: 'HPP/COGS dan klasifikasi beban belum lengkap.' },
      cashFlow: {
        supported: true,
        cashIn: cashReceived,
        cashOut: cashOutflow,
        net: cashReceived - cashOutflow,
        openingBalance: null,
        closingBalance: null,
      },
      availability: {
        revenue: true,
        expenses: true,
        refunds: true,
        receivables: true,
        payables: true,
        cashFlow: true,
        profitLoss: false,
        cogs: false,
        tax: false,
        reconciliation: false,
      },
      unsupported: ['profitLoss', 'cogs', 'tax', 'reconciliation', 'openingClosingCash'],
    };
    return report;
  }

  async export(c: string, f: FinanceQuery, authz: { companyRole?: string; branchIds?: string[]; actorUserId?: string } | undefined, format: 'pdf' | 'xlsx') {
    const report = await this.report(c, f, authz);
    const buffer = format === 'pdf' ? await exportPdf(report) : await exportXlsx(report);
    await this.audit?.record({
      action: 'FINANCE_REPORT_EXPORTED',
      resourceType: 'finance_report',
      actorUserId: authz?.actorUserId,
      companyId: c,
      branchId: f.branchId,
      metadata: { format, periodStart: f.from ?? null, periodEnd: f.to ?? null, branchScope: f.branchId ?? (authz?.branchIds?.length ? authz.branchIds : 'company-wide'), revenueRowCount: report.revenueRows.length, expenseRowCount: report.expenseRows.length },
    });
    return {
      buffer,
      filename: reportFilename(report, format),
      report,
    };
  }
}

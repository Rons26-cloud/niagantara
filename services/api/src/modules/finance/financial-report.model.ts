export type FinanceFilters = {
  from?: string;
  to?: string;
  branchId?: string;
  storeId?: string;
};

export type FinancialReport = {
  [key: string]: any;
  metadata: {
    companyId: string;
    companyName: string | null;
    branchId: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    generatedAt: string;
    generatedBy: string | null;
    currency: 'IDR';
    timezone: string;
  };
  filters: FinanceFilters;
  summary: {
    netSales: number;
    recordedExpenses: number;
    cashReceived: number;
    cashOutflow: number;
    netCashFlow: number;
    receivablesOutstanding: number;
    receivablesOverdue: number;
    payablesOutstanding: number;
    payablesOverdue: number;
    transactionCount: number;
  };
  revenueRows: any[];
  expenseRows: any[];
  receivables: { rows: any[]; outstanding: number; overdue: number };
  payables: { rows: any[]; outstanding: number; overdue: number };
  branchAnalysis: any[];
  cashFlow: {
    supported: true;
    cashIn: number;
    cashOut: number;
    net: number;
    openingBalance: null;
    closingBalance: null;
  };
  profitLoss: { supported: false; reason: string };
  availability: Record<string, boolean>;
  unsupported: string[];
};

export function sanitizeSpreadsheetText(value: unknown): string {
  const text = String(value ?? '');
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

export function safeReportFilename(prefix: string, period: string): string {
  const safePrefix = prefix.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '');
  const safePeriod = period.replace(/[^0-9-]+/g, '-');
  return `${safePrefix || 'niagantara-laporan-keuangan'}-${safePeriod || 'periode'}`;
}

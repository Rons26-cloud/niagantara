import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import { exportPdf, exportXlsx, reportFilename } from '../src/modules/finance/financial-report.exporter.js';
import { sanitizeSpreadsheetText } from '../src/modules/finance/financial-report.model.js';

const report: any = {
  metadata: { companyId: 'company-a', companyName: 'Demo', branchId: null, periodStart: '2026-09-01', periodEnd: '2026-09-30', generatedAt: '2026-09-30T10:00:00Z', generatedBy: null, currency: 'IDR', timezone: 'UTC' },
  filters: { from: '2026-09-01', to: '2026-09-30' },
  summary: { netSales: 100000, recordedExpenses: 25000, cashReceived: 80000, cashOutflow: 25000, netCashFlow: 55000, receivablesOutstanding: 20000, receivablesOverdue: 0, payablesOutstanding: 30000, payablesOverdue: 0, transactionCount: 2 },
  revenueRows: [{ id: 's1', created_at: '2026-09-01T10:00:00Z', transaction_number: 'INV-1', branch_id: 'b1', subtotal: 100000, grand_total: 100000, refunded_total: 0, status: 'PAID', customer: { name: '=Injected' }, payment: [{ method: 'CASH' }] }],
  expenseRows: [{ id: 'e1', expense_date: '2026-09-02', description: '+formula', amount: 25000, status: 'RECORDED', category: { name: 'Operasional' }, branch_id: 'b1', payment_method: 'CASH' }],
  receivables: { rows: [], outstanding: 20000, overdue: 0 },
  payables: { rows: [], outstanding: 30000, overdue: 0 },
  branchAnalysis: [],
  availability: {},
  unsupported: ['profitLoss'],
};

test('sanitizes spreadsheet formula prefixes without changing numeric values', () => {
  assert.equal(sanitizeSpreadsheetText('=SUM(A1)'), "'=SUM(A1)");
  assert.equal(sanitizeSpreadsheetText('@mention'), "'@mention");
  assert.equal(sanitizeSpreadsheetText('normal'), 'normal');
});

test('exports use safe filename and produce valid non-empty buffers', async () => {
  assert.equal(reportFilename(report, 'pdf'), 'niagantara-laporan-keuangan-2026-09-01-2026-09-30.pdf');
  const pdf = await exportPdf(report);
  assert.ok(pdf.length > 100);
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
  const xlsx = await exportXlsx(report);
  assert.ok(xlsx.length > 100);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(xlsx);
  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ['Ringkasan', 'Pendapatan', 'Pengeluaran', 'Arus Kas']);
  assert.equal(workbook.getWorksheet('Ringkasan')?.getCell('B4').value, 100000);
  assert.equal(typeof workbook.getWorksheet('Pendapatan')?.getCell('F2').value, 'number');
  assert.equal(workbook.getWorksheet('Pendapatan')?.getCell('D2').value, "'=Injected");
});

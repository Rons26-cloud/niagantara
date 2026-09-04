import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import type { FinancialReport } from './financial-report.model.js';
import { sanitizeSpreadsheetText, safeReportFilename } from './financial-report.model.js';

const currency = (value: unknown) => `Rp ${Math.round(Number(value ?? 0)).toLocaleString('id-ID')}`;
const dateText = (value: unknown) => value ? new Date(String(value)).toLocaleDateString('id-ID') : '—';

export function reportPeriod(report: FinancialReport) {
  return report.metadata.periodStart && report.metadata.periodEnd
    ? `${report.metadata.periodStart}_${report.metadata.periodEnd}`
    : new Date().toISOString().slice(0, 10);
}

export function reportFilename(report: FinancialReport, extension: 'pdf' | 'xlsx') {
  return `${safeReportFilename('niagantara-laporan-keuangan', reportPeriod(report))}.${extension}`;
}

function summaryRows(report: FinancialReport) {
  return [
    ['Net Sales', report.summary.netSales],
    ['Recorded Expenses', report.summary.recordedExpenses],
    ['Cash Received', report.summary.cashReceived],
    ['Cash Outflow', report.summary.cashOutflow],
    ['Net Cash Flow', report.summary.netCashFlow],
    ['Receivables Outstanding', report.summary.receivablesOutstanding],
    ['Payables Outstanding', report.summary.payablesOutstanding],
    ['Transactions', report.summary.transactionCount],
  ] as [string, number][];
}

export async function exportPdf(report: FinancialReport): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true });
  const chunks: Buffer[] = [];
  const output = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  const heading = (title: string) => {
    doc.moveDown(0.8).fontSize(13).fillColor('#0f172a').font('Helvetica-Bold').text(title);
    doc.moveDown(0.25).font('Helvetica').fontSize(9).fillColor('#475569');
  };
  doc.fontSize(20).fillColor('#123b66').font('Helvetica-Bold').text('NIAGANTARA');
  doc.fontSize(14).fillColor('#0f172a').text('LAPORAN KEUANGAN');
  doc.moveDown(0.5).font('Helvetica').fontSize(9).fillColor('#475569')
    .text(`Periode: ${report.metadata.periodStart ?? '—'} sampai ${report.metadata.periodEnd ?? '—'}`)
    .text(`Cabang: ${report.metadata.branchId ?? 'Semua cabang'}`)
    .text(`Generated: ${new Date(report.metadata.generatedAt).toLocaleString('id-ID')}`)
    .text(`Timezone: ${report.metadata.timezone}`);
  heading('RINGKASAN');
  for (const [label, value] of summaryRows(report)) doc.fontSize(10).fillColor('#0f172a').text(`${label}: ${label === 'Transactions' ? value.toLocaleString('id-ID') : currency(value)}`);
  heading('PENDAPATAN');
  doc.fontSize(8).font('Helvetica-Bold').text('Tanggal | Transaksi | Cabang | Net Sales | Status');
  doc.font('Helvetica');
  for (const row of report.revenueRows.slice(0, 5000)) {
    doc.text(`${dateText(row.created_at)} | ${String(row.transaction_number ?? row.id)} | ${String(row.branch_id ?? '—')} | ${currency(Number(row.grand_total ?? 0) - Number(row.refunded_total ?? 0))} | ${String(row.status ?? '—')}`);
  }
  heading('PENGELUARAN');
  doc.fontSize(8).font('Helvetica-Bold').text('Tanggal | Kategori | Deskripsi | Jumlah | Status');
  doc.font('Helvetica');
  for (const row of report.expenseRows.slice(0, 5000)) doc.text(`${dateText(row.expense_date)} | ${String(row.category?.name ?? 'Lainnya')} | ${String(row.description ?? row.id)} | ${currency(row.amount)} | ${String(row.status ?? 'RECORDED')}`);
  heading('PIUTANG DAN UTANG');
  doc.fontSize(10).text(`Piutang berjalan: ${currency(report.summary.receivablesOutstanding)} (overdue ${currency(report.summary.receivablesOverdue)})`);
  doc.text(`Utang berjalan: ${currency(report.summary.payablesOutstanding)} (overdue ${currency(report.summary.payablesOverdue)})`);
  heading('CATATAN');
  doc.fontSize(9).text('Laba kotor dan laba bersih belum tersedia karena data HPP/COGS belum lengkap.');
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor('#64748b').text(`Page ${i - range.start + 1} of ${range.count}`, 42, 806, { align: 'right' });
  }
  doc.end();
  return output;
}

function addSheet(workbook: ExcelJS.Workbook, name: string, headers: string[], rows: (string | number | Date | null)[][]) {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow(headers.map(sanitizeSpreadsheetText));
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123B66' } };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + Math.max(headers.length, 1))}1` };
  for (const row of rows) sheet.addRow(row.map((value) => typeof value === 'string' ? sanitizeSpreadsheetText(value) : value));
  sheet.columns.forEach((column) => { const values = column.values ?? []; column.width = Math.min(42, Math.max(12, ...values.slice(1).map((value) => String(value ?? '').length + 2))); });
  return sheet;
}

export async function exportXlsx(report: FinancialReport): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NIAGANTARA';
  workbook.title = 'NIAGANTARA Financial Report';
  const summary = addSheet(workbook, 'Ringkasan', ['Metric', 'Value'], [
    ['Periode', `${report.metadata.periodStart ?? '—'} s/d ${report.metadata.periodEnd ?? '—'}`],
    ['Cabang', report.metadata.branchId ?? 'Semua cabang'],
    ...summaryRows(report),
  ]);
  summary.getColumn(2).numFmt = '#,##0';
  addSheet(workbook, 'Pendapatan', ['Tanggal', 'Transaksi', 'Cabang', 'Customer', 'Metode', 'Subtotal', 'Diskon', 'Refund', 'Net Sales', 'Status'], report.revenueRows.slice(0, 5000).map((row) => [new Date(row.created_at), row.transaction_number ?? row.id, row.branch_id ?? null, row.customer?.name ?? null, row.payment?.[0]?.method ?? null, Number(row.subtotal ?? 0), Number(Number(row.item_discount_total ?? 0) + Number(row.transaction_discount ?? 0)), Number(row.refunded_total ?? 0), Number(row.grand_total ?? 0) - Number(row.refunded_total ?? 0), row.status ?? null]));
  addSheet(workbook, 'Pengeluaran', ['Tanggal', 'ID', 'Kategori', 'Deskripsi', 'Cabang', 'Metode', 'Jumlah', 'Status'], report.expenseRows.slice(0, 5000).map((row) => [new Date(`${row.expense_date}T00:00:00Z`), row.id, row.category?.name ?? 'Lainnya', row.description, row.branch?.name ?? row.branch_id ?? null, row.payment_method, Number(row.amount ?? 0), row.status ?? 'RECORDED']));
  addSheet(workbook, 'Arus Kas', ['Metric', 'Value'], [['Cash In', report.summary.cashReceived], ['Cash Out', report.summary.cashOutflow], ['Net Cash Flow', report.summary.netCashFlow]]);
  if (report.receivables.rows.length) addSheet(workbook, 'Piutang', ['ID', 'Customer', 'Invoice', 'Jatuh Tempo', 'Total', 'Dibayar', 'Sisa', 'Status'], report.receivables.rows.slice(0, 5000).map((row) => [row.id, row.customer?.name ?? null, row.sale?.transaction_number ?? row.sale_id, row.due_date ? new Date(`${row.due_date}T00:00:00Z`) : null, Number(row.original_amount ?? 0), Number(row.paid_amount ?? 0), Number(row.remaining_amount ?? 0), row.status]));
  if (report.payables.rows.length) addSheet(workbook, 'Utang', ['ID', 'Supplier', 'Purchase', 'Jatuh Tempo', 'Total', 'Dibayar', 'Sisa', 'Status'], report.payables.rows.slice(0, 5000).map((row) => [row.id, row.supplier?.name ?? null, row.purchase?.purchase_number ?? row.purchase_id, row.due_date ? new Date(`${row.due_date}T00:00:00Z`) : null, Number(row.original_amount ?? 0), Number(row.paid_amount ?? 0), Number(row.remaining_amount ?? 0), row.status]));
  if (report.branchAnalysis.length) addSheet(workbook, 'Cabang', ['Cabang', 'Pendapatan', 'Pengeluaran', 'Transaksi'], report.branchAnalysis.map((row) => [row.branchId, Number(row.revenue ?? 0), Number(row.expenses ?? 0), Number(row.transactions ?? 0)]));
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

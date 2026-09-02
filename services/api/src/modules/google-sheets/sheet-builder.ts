import { safeSheetValue, validateFormulaTemplate } from './google-security.js';
export type SheetColumn = {
  column_key: string;
  label: string;
  data_type: string;
  formula_template?: string | null;
};
type DefaultColumn = [string, string, string];
export const DEFAULT_COLUMNS: Record<string, DefaultColumn[]> = {
  sales: [
    ['transaction_number', 'Transaction', 'text'],
    ['completed_at', 'Date', 'datetime'],
    ['status', 'Status', 'text'],
    ['grand_total', 'Total', 'currency'],
    ['refunded_total', 'Refund', 'currency'],
  ],
  inventory: [
    ['sku', 'SKU', 'text'],
    ['product_name', 'Product', 'text'],
    ['warehouse_name', 'Warehouse', 'text'],
    ['quantity', 'Quantity', 'number'],
    ['minimum_stock', 'Minimum', 'number'],
    ['updated_at', 'Updated', 'datetime'],
  ],
  purchases: [
    ['purchase_number', 'Purchase', 'text'],
    ['purchase_date', 'Date', 'date'],
    ['supplier_name', 'Supplier', 'text'],
    ['status', 'Status', 'text'],
    ['grand_total', 'Total', 'currency'],
  ],
  finance: [
    ['occurred_at', 'Date', 'datetime'],
    ['event_type', 'Event', 'text'],
    ['direction', 'Direction', 'text'],
    ['amount', 'Amount', 'currency'],
    ['payment_method', 'Payment', 'text'],
  ],
};
export function defaultColumns(dataset: string) {
  return (DEFAULT_COLUMNS[dataset] ?? []).map(
    ([column_key, label, data_type], position) => ({
      column_key,
      label,
      data_type,
      position,
    }),
  );
}
export function monthlySheetTitle(title: string, date = new Date()) {
  return `${title} ${date.toISOString().slice(0, 7)}`.slice(0, 100);
}
export function buildSheetRow(
  columns: SheetColumn[],
  record: Record<string, unknown>,
) {
  return columns.map((c) =>
    c.data_type === 'formula'
      ? validateFormulaTemplate(c.formula_template ?? '')
      : safeSheetValue(record[c.column_key]),
  );
}

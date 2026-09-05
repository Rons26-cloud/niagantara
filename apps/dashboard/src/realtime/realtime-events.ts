export const REALTIME_EVENTS = [
  'sale.created',
  'sale.updated',
  'sale.cancelled',
  'sale.deleted',
  'inventory.updated',
  'purchase.created',
  'purchase.updated',
  'purchase.received',
  'purchase.deleted',
  'expense.created',
  'expense.updated',
  'payment.recorded',
  'attendance.updated',
  'catalog.updated',
  'customer.updated',
  'supplier.updated',
  'organization.updated',
  'shift.updated',
  'team.updated',
  'audit_logs.updated',
  'refunds.updated',
  'refund_items.updated',
  'payables.updated',
  'receivables.updated',
  'financial_transactions.updated',
  'sheet.updated',
] as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[number];

export type BusinessChange = {
  entity: string;
  action: string;
  id: string | null;
  company_id: string;
  branch_id: string | null;
  occurred_at: string;
};

export type InvalidationResource =
  | 'sales'
  | 'inventory'
  | 'finance'
  | 'attendance'
  | 'sheets'
  | 'catalog'
  | 'customers'
  | 'suppliers'
  | 'organization'
  | 'shifts'
  | 'team';

export function resourcesForEvent(event: string): InvalidationResource[] {
  if (event.startsWith('sale.')) return ['sales', 'finance'];
  if (event.startsWith('inventory.')) return ['inventory'];
  if (event.startsWith('purchase.')) return ['finance', 'inventory'];
  if (event.startsWith('expense.')) return ['finance'];
  if (event.startsWith('payment.')) return ['finance'];
  if (event.startsWith('attendance.')) return ['attendance'];
  if (event.startsWith('catalog.')) return ['catalog', 'inventory'];
  if (event.startsWith('customer.')) return ['customers'];
  if (event.startsWith('supplier.')) return ['suppliers'];
  if (event.startsWith('organization.')) return ['organization'];
  if (event.startsWith('shift.')) return ['shifts', 'sales', 'finance'];
  if (event.startsWith('team.')) return ['team', 'attendance'];
  if (event === 'audit_logs.updated') return ['team'];
  if (event === 'refunds.updated' || event === 'refund_items.updated') return ['sales', 'finance'];
  if (event === 'payables.updated' || event === 'receivables.updated') return ['finance'];
  if (event === 'financial_transactions.updated') return ['finance'];
  if (event.startsWith('sheet.')) return ['sheets'];
  return ['sheets'];
}

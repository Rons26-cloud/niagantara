export type NormalizedReceipt = {
  receiptNumber: string;
  createdAt: string;
  company?: string;
  store?: string;
  branch?: string;
  cashier?: string;
  customer?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice?: number;
    lineTotal?: number;
  }>;
  subtotal?: number;
  discount?: number;
  tax?: number | null;
  grandTotal: number;
  paymentMethod?: string;
  cashReceived?: number | null;
  change?: number | null;
  status?: string;
};
export function normalizeReceipt(
  sale: any,
  customer?: { name?: string } | null,
): NormalizedReceipt {
  const payment = Array.isArray(sale?.payments)
    ? sale.payments[0]
    : Array.isArray(sale?.payment)
      ? sale.payment[0]
      : sale?.payment;
  return {
    receiptNumber: sale?.transaction_number ?? sale?.id ?? '',
    createdAt: sale?.created_at ?? '',
    company: sale?.company?.name ?? sale?.company_name,
    store: sale?.store?.name,
    branch: sale?.branch?.name,
    cashier: sale?.cashier?.full_name,
    customer: customer?.name ?? sale?.customer?.name,
    items: (sale?.items ?? []).map((item: any) => ({
      name: item.product_name ?? item.name ?? 'Item',
      quantity: Number(item.quantity),
      unitPrice: item.unit_price == null ? undefined : Number(item.unit_price),
      lineTotal: item.line_total == null ? undefined : Number(item.line_total),
    })),
    subtotal: sale?.subtotal == null ? undefined : Number(sale.subtotal),
    discount:
      sale?.item_discount_total == null && sale?.transaction_discount == null
        ? undefined
        : Number(sale.item_discount_total ?? 0) +
          Number(sale.transaction_discount ?? 0),
    tax:
      sale?.tax_total == null && sale?.tax == null
        ? null
        : Number(sale.tax_total ?? sale.tax),
    grandTotal: Number(sale?.grand_total ?? 0),
    paymentMethod: payment?.method,
    cashReceived:
      payment?.amount_received == null ? null : Number(payment.amount_received),
    change:
      payment?.change_amount == null ? null : Number(payment.change_amount),
    status: sale?.status,
  };
}

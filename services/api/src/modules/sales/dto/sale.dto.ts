export type SaleQuery = {
  search?: string;
  branchId?: string;
  cashierId?: string;
  paymentMethod?: string;
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};
export type CancelSaleInput = { reason: string };
export type RefundSaleInput = {
  reason: string;
  items: {
    saleItemId: string;
    quantity: number;
    restock: boolean;
    condition: 'SELLABLE' | 'DAMAGED' | 'NOT_RETURNED';
  }[];
};

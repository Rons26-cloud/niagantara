export type DiscountType = 'PERCENT' | 'FIXED';
export type CheckoutItem = {
  productId: string;
  quantity: number;
  barcode?: string;
  discountType?: DiscountType;
  discountValue?: number;
};
export type CheckoutInput = {
  storeId: string;
  branchId: string;
  warehouseId: string;
  shiftId: string;
  idempotencyKey: string;
  items: CheckoutItem[];
  transactionDiscountType?: DiscountType;
  transactionDiscountValue?: number;
  taxRate?: number;
  paymentMethod: 'CASH' | 'QRIS' | 'BANK_TRANSFER' | 'E_WALLET' | 'OTHER';
  amountReceived?: number;
  paymentReference?: string;
};

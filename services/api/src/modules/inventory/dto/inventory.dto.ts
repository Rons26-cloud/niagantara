export type AdjustmentInput = {
  branchId: string;
  warehouseId: string;
  productId: string;
  quantityDelta: number;
  minimumStock?: number;
  movementType:
    | 'STOCK_IN'
    | 'STOCK_OUT'
    | 'ADJUSTMENT'
    | 'SALE'
    | 'PURCHASE'
    | 'RETURN'
    | 'DAMAGED';
  notes?: string;
  referenceType?: string;
  referenceId?: string;
};
export type TransferInput = {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  productId: string;
  quantity: number;
  notes?: string;
};

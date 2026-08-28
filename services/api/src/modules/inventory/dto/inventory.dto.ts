export type AdjustmentInput = {
  branchId: string;
  warehouseId: string;
  productId: string;
  quantityDelta: number;
  minimumStock?: number;
  reason: 'CORRECTION' | 'DAMAGED' | 'EXPIRED' | 'LOST' | 'MANUAL_CORRECTION' | 'OTHER';
  notes?: string;
  referenceType?: string;
  referenceId?: string;
};
export type InventoryQuery = {
  branchId?: string;
  categoryId?: string;
  search?: string;
  status?: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  limit?: number | string;
  offset?: number | string;
};
export type MovementQuery = {
  branchId?: string;
  productId?: string;
  movementType?: string;
  from?: string;
  to?: string;
  limit?: number | string;
  offset?: number | string;
};
export type TransferInput = {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  productId: string;
  quantity: number;
  notes?: string;
};

export type WarehouseInput = {
  storeId: string;
  branchId: string;
  name: string;
  code: string;
  isMain?: boolean;
  status?: 'active' | 'inactive';
};

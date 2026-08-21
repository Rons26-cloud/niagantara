export type ProductInput = {
  name: string;
  sku: string;
  categoryId?: string | null;
  description?: string | null;
  costPrice?: number;
  sellingPrice?: number;
  status?: 'active' | 'inactive' | 'archived';
  barcode?: string;
};
export type ProductQuery = {
  search?: string;
  status?: string;
  categoryId?: string;
  limit?: number;
  cursor?: string;
};

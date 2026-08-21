export type BarcodeInput = {
  productId: string;
  code?: string;
  source?: 'manufacturer' | 'manual' | 'internal';
  isPrimary?: boolean;
};

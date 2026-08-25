export interface DemoProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minimumStock: number;
  barcode?: string;
  unit: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DemoCategory {
  id: string;
  name: string;
  description: string;
}

export interface DemoCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalPurchases: number;
  lastPurchase: string;
}

export interface DemoSupplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
}

export interface DemoEmployee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  branch: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DemoSale {
  id: string;
  invoice: string;
  date: string;
  customer: string;
  cashier: string;
  branch: string;
  total: number;
  payment: 'CASH' | 'QRIS' | 'TRANSFER';
  status: 'PAID' | 'PENDING' | 'REFUNDED';
  items: number;
}

export interface DemoShift {
  id: string;
  cashier: string;
  branch: string;
  openingTime: string;
  closingTime?: string;
  openingCash: number;
  expectedCash: number;
  closingCash?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED';
}

export interface DemoPurchase {
  id: string;
  invoice: string;
  date: string;
  supplier: string;
  branch: string;
  total: number;
  status: 'RECEIVED' | 'PENDING' | 'DRAFT';
  items: number;
  productId?: string;
  productName?: string;
  quantity?: number;
}

export interface DemoExpense {
  id: string;
  category: string;
  amount: number;
  date: string;
  branch: string;
  description: string;
}

export interface DemoAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  branch: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface DemoStockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'ADJUSTMENT' | 'SALE' | 'PURCHASE' | 'TRANSFER' | 'RETURN';
  quantity: number;
  branch: string;
  date: string;
  reason?: string;
}

export interface DemoBranch {
  id: string;
  name: string;
  code: string;
  storeId: string;
}

export interface DemoStore {
  id: string;
  name: string;
}

export interface DemoWarehouse {
  id: string;
  name: string;
  code: string;
  storeId: string;
  branchId: string;
}

export interface DemoFinance {
  cash: number;
  bank: number;
  receivable: number;
  payable: number;
  expense: number;
  revenue: number;
  profit: number;
}

export interface DemoSheetCell {
  row: number;
  col: number;
  value: string;
}

export interface DemoSheet {
  name: string;
  cells: DemoSheetCell[];
  headers: string[];
}

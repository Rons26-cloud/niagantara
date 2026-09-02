import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import type {
  DemoProduct,
  DemoCategory,
  DemoCustomer,
  DemoSupplier,
  DemoEmployee,
  DemoSale,
  DemoShift,
  DemoPurchase,
  DemoExpense,
  DemoAttendance,
  DemoStockMovement,
  DemoBranch,
  DemoStore,
  DemoWarehouse,
  DemoFinance,
  DemoSheet,
} from './demo-types';
import {
  demoProducts,
  demoCategories,
  demoCustomers,
  demoSuppliers,
  demoEmployees,
  demoSales,
  demoShifts,
  demoPurchases,
  demoExpenses,
  demoAttendance,
  demoStockMovements,
  demoBranches,
  demoStores,
  demoWarehouses,
  demoFinance,
  demoSheet,
  demoCompany,
  demoUser,
  demoDashboardMetrics,
} from './demo-data';

interface DemoStoreContextType {
  company: string;
  user: { name: string; role: string };

  products: DemoProduct[];
  categories: DemoCategory[];
  customers: DemoCustomer[];
  suppliers: DemoSupplier[];
  employees: DemoEmployee[];
  sales: DemoSale[];
  shifts: DemoShift[];
  purchases: DemoPurchase[];
  expenses: DemoExpense[];
  attendance: DemoAttendance[];
  stockMovements: DemoStockMovement[];
  branches: DemoBranch[];
  stores: DemoStore[];
  warehouses: DemoWarehouse[];
  finance: DemoFinance;
  sheet: DemoSheet;
  dashboardMetrics: typeof demoDashboardMetrics;

  selectedBranch: string;
  selectedStore: string;

  setSelectedBranch: (branchId: string) => void;
  setSelectedStore: (storeId: string) => void;

  addProduct: (product: Omit<DemoProduct, 'id'>) => void;
  updateProduct: (id: string, product: Partial<DemoProduct>) => void;
  deleteProduct: (id: string) => void;

  addCustomer: (customer: Omit<DemoCustomer, 'id'>) => void;
  updateCustomer: (id: string, customer: Partial<DemoCustomer>) => void;
  deleteCustomer: (id: string) => void;

  addSupplier: (supplier: Omit<DemoSupplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<DemoSupplier>) => void;
  deleteSupplier: (id: string) => void;

  addEmployee: (employee: Omit<DemoEmployee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<DemoEmployee>) => void;
  deleteEmployee: (id: string) => void;

  addSale: (sale: Omit<DemoSale, 'id'>) => void;

  openShift: (shift: Omit<DemoShift, 'id' | 'status'>) => void;
  closeShift: (id: string, closingCash: number) => void;

  addPurchase: (purchase: Omit<DemoPurchase, 'id'>) => void;
  updatePurchaseStatus: (id: string, status: DemoPurchase['status']) => void;

  addExpense: (expense: Omit<DemoExpense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<DemoExpense>) => void;
  deleteExpense: (id: string) => void;

  clockIn: (employeeId: string, employeeName: string, branch: string) => void;
  clockOut: (attendanceId: string) => void;

  addStockMovement: (movement: Omit<DemoStockMovement, 'id'>) => void;
  adjustStock: (productId: string, quantity: number, reason: string) => void;

  updateSheetCell: (row: number, col: number, value: string) => void;

  resetDemo: () => void;
}

const DemoStoreContext = createContext<DemoStoreContextType | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<DemoProduct[]>(demoProducts);
  const [categories, setCategories] = useState<DemoCategory[]>(demoCategories);
  const [customers, setCustomers] = useState<DemoCustomer[]>(demoCustomers);
  const [suppliers, setSuppliers] = useState<DemoSupplier[]>(demoSuppliers);
  const [employees, setEmployees] = useState<DemoEmployee[]>(demoEmployees);
  const [sales, setSales] = useState<DemoSale[]>(demoSales);
  const [shifts, setShifts] = useState<DemoShift[]>(demoShifts);
  const [purchases, setPurchases] = useState<DemoPurchase[]>(demoPurchases);
  const [expenses, setExpenses] = useState<DemoExpense[]>(demoExpenses);
  const [attendance, setAttendance] =
    useState<DemoAttendance[]>(demoAttendance);
  const [stockMovements, setStockMovements] =
    useState<DemoStockMovement[]>(demoStockMovements);
  const [branches] = useState<DemoBranch[]>(demoBranches);
  const [stores] = useState<DemoStore[]>(demoStores);
  const [warehouses, setWarehouses] = useState<DemoWarehouse[]>(demoWarehouses);
  const [finance, setFinance] = useState<DemoFinance>(demoFinance);
  const [sheet, setSheet] = useState<DemoSheet>(demoSheet);
  const [dashboardMetrics, setDashboardMetrics] =
    useState(demoDashboardMetrics);
  const [selectedBranch, setSelectedBranch] = useState('branch-1');
  const [selectedStore, setSelectedStore] = useState('store-1');

  const generateId = useCallback(() => {
    return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }, []);

  const addProduct = useCallback(
    (product: Omit<DemoProduct, 'id'>) => {
      const newProduct: DemoProduct = { ...product, id: generateId() };
      setProducts((prev) => [...prev, newProduct]);
    },
    [generateId],
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<DemoProduct>) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    },
    [],
  );

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addCustomer = useCallback(
    (customer: Omit<DemoCustomer, 'id'>) => {
      const newCustomer: DemoCustomer = { ...customer, id: generateId() };
      setCustomers((prev) => [...prev, newCustomer]);
    },
    [generateId],
  );

  const updateCustomer = useCallback(
    (id: string, updates: Partial<DemoCustomer>) => {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    },
    [],
  );

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addSupplier = useCallback(
    (supplier: Omit<DemoSupplier, 'id'>) => {
      const newSupplier: DemoSupplier = { ...supplier, id: generateId() };
      setSuppliers((prev) => [...prev, newSupplier]);
    },
    [generateId],
  );

  const updateSupplier = useCallback(
    (id: string, updates: Partial<DemoSupplier>) => {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
    },
    [],
  );

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addEmployee = useCallback(
    (employee: Omit<DemoEmployee, 'id'>) => {
      const newEmployee: DemoEmployee = { ...employee, id: generateId() };
      setEmployees((prev) => [...prev, newEmployee]);
    },
    [generateId],
  );

  const updateEmployee = useCallback(
    (id: string, updates: Partial<DemoEmployee>) => {
      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      );
    },
    [],
  );

  const deleteEmployee = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addSale = useCallback(
    (sale: Omit<DemoSale, 'id'>) => {
      const newSale: DemoSale = { ...sale, id: generateId() };
      setSales((prev) => [newSale, ...prev]);

      setDashboardMetrics((prev) => ({
        ...prev,
        todaySales: prev.todaySales + sale.total,
        todayTransactions: prev.todayTransactions + 1,
        productsSold: prev.productsSold + sale.items,
      }));
    },
    [generateId],
  );

  const openShift = useCallback(
    (shift: Omit<DemoShift, 'id' | 'status'>) => {
      const newShift: DemoShift = {
        ...shift,
        id: generateId(),
        status: 'OPEN',
      };
      setShifts((prev) => [newShift, ...prev]);
    },
    [generateId],
  );

  const closeShift = useCallback((id: string, closingCash: number) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const difference = closingCash - s.expectedCash;
          return {
            ...s,
            status: 'CLOSED' as const,
            closingTime: new Date().toISOString(),
            closingCash,
            difference,
          };
        }
        return s;
      }),
    );
  }, []);

  const addPurchase = useCallback(
    (purchase: Omit<DemoPurchase, 'id'>) => {
      const newPurchase: DemoPurchase = { ...purchase, id: generateId() };
      setPurchases((prev) => [newPurchase, ...prev]);
    },
    [generateId],
  );

  const updatePurchaseStatus = useCallback(
    (id: string, status: DemoPurchase['status']) => {
      setPurchases((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p)),
      );
    },
    [],
  );

  const addExpense = useCallback(
    (expense: Omit<DemoExpense, 'id'>) => {
      const newExpense: DemoExpense = { ...expense, id: generateId() };
      setExpenses((prev) => [newExpense, ...prev]);
      setFinance((prev) => ({
        ...prev,
        expense: prev.expense + expense.amount,
      }));
    },
    [generateId],
  );

  const updateExpense = useCallback(
    (id: string, updates: Partial<DemoExpense>) => {
      setExpenses((prev) =>
        prev.map((e) => {
          if (e.id === id) {
            const updated = { ...e, ...updates };
            if (updates.amount !== undefined) {
              setFinance((f) => ({
                ...f,
                expense: f.expense - e.amount + updated.amount,
              }));
            }
            return updated;
          }
          return e;
        }),
      );
    },
    [],
  );

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => {
      const expense = prev.find((e) => e.id === id);
      if (expense) {
        setFinance((f) => ({ ...f, expense: f.expense - expense.amount }));
      }
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  const clockIn = useCallback(
    (employeeId: string, employeeName: string, branch: string) => {
      const now = new Date();
      const newAttendance: DemoAttendance = {
        id: generateId(),
        employeeId,
        employeeName,
        date: now.toISOString().split('T')[0],
        clockIn: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        branch,
        status: 'PRESENT',
      };
      setAttendance((prev) => [newAttendance, ...prev]);
    },
    [generateId],
  );

  const clockOut = useCallback((attendanceId: string) => {
    const now = new Date();
    setAttendance((prev) =>
      prev.map((a) => {
        if (a.id === attendanceId) {
          return {
            ...a,
            clockOut: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          };
        }
        return a;
      }),
    );
  }, []);

  const addStockMovement = useCallback(
    (movement: Omit<DemoStockMovement, 'id'>) => {
      const newMovement: DemoStockMovement = { ...movement, id: generateId() };
      setStockMovements((prev) => [newMovement, ...prev]);

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === movement.productId) {
            return { ...p, stock: p.stock + movement.quantity };
          }
          return p;
        }),
      );
    },
    [generateId],
  );

  const adjustStock = useCallback(
    (productId: string, quantity: number, reason: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const newMovement: Omit<DemoStockMovement, 'id'> = {
        productId,
        productName: product.name,
        type: 'ADJUSTMENT',
        quantity,
        branch: selectedBranch,
        date: new Date().toISOString().split('T')[0],
        reason,
      };
      addStockMovement(newMovement);
    },
    [products, selectedBranch, addStockMovement],
  );

  const updateSheetCell = useCallback(
    (row: number, col: number, value: string) => {
      setSheet((prev) => {
        const existingIndex = prev.cells.findIndex(
          (c) => c.row === row && c.col === col,
        );
        if (existingIndex >= 0) {
          const updated = [...prev.cells];
          updated[existingIndex] = { row, col, value };
          return { ...prev, cells: updated };
        }
        return { ...prev, cells: [...prev.cells, { row, col, value }] };
      });
    },
    [],
  );

  const resetDemo = useCallback(() => {
    setProducts(demoProducts);
    setCategories(demoCategories);
    setCustomers(demoCustomers);
    setSuppliers(demoSuppliers);
    setEmployees(demoEmployees);
    setSales(demoSales);
    setShifts(demoShifts);
    setPurchases(demoPurchases);
    setExpenses(demoExpenses);
    setAttendance(demoAttendance);
    setStockMovements(demoStockMovements);
    setWarehouses(demoWarehouses);
    setFinance(demoFinance);
    setSheet(demoSheet);
    setDashboardMetrics(demoDashboardMetrics);
    setSelectedBranch('branch-1');
    setSelectedStore('store-1');
  }, []);

  const value: DemoStoreContextType = {
    company: demoCompany,
    user: demoUser,
    products,
    categories,
    customers,
    suppliers,
    employees,
    sales,
    shifts,
    purchases,
    expenses,
    attendance,
    stockMovements,
    branches,
    stores,
    warehouses,
    finance,
    sheet,
    dashboardMetrics,
    selectedBranch,
    selectedStore,
    setSelectedBranch,
    setSelectedStore,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addSale,
    openShift,
    closeShift,
    addPurchase,
    updatePurchaseStatus,
    addExpense,
    updateExpense,
    deleteExpense,
    clockIn,
    clockOut,
    addStockMovement,
    adjustStock,
    updateSheetCell,
    resetDemo,
  };

  return (
    <DemoStoreContext.Provider value={value}>
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore() {
  const context = useContext(DemoStoreContext);
  if (!context) {
    throw new Error('useDemoStore must be used within DemoStoreProvider');
  }
  return context;
}

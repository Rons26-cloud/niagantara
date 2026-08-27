import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { CompaniesModule } from './modules/companies/companies.module.js';
import { StoresModule } from './modules/stores/stores.module.js';
import { BranchesModule } from './modules/branches/branches.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { SecurityEventsModule } from './modules/security-events/security-events.module.js';
import { SupabaseModule } from './integrations/supabase/supabase.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { BarcodesModule } from './modules/barcodes/barcodes.module.js';
import { WarehousesModule } from './modules/warehouses/warehouses.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { PosModule } from './modules/pos/pos.module.js';
import { SalesModule } from './modules/sales/sales.module.js';
import { ShiftsModule } from './modules/shifts/shifts.module.js';
import { SuppliersModule } from './modules/suppliers/suppliers.module.js';
import { PurchasesModule } from './modules/purchases/purchases.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { EmployeesModule } from './modules/employees/employees.module.js';
import { AttendanceModule } from './modules/attendance/attendance.module.js';
import { ExpensesModule } from './modules/expenses/expenses.module.js';
import { FinanceModule } from './modules/finance/finance.module.js';
import { GoogleSheetsModule } from './modules/google-sheets/google-sheets.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { SupabaseService } from './integrations/supabase/supabase.service.js';
import { validateServerEnvironment } from './config/environment.js';

@Controller('health')
class HealthController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  health() {
    return { status: 'ok', service: 'niagantara-api', api_version: 'v1' };
  }

  @Get('readiness')
  async readiness() {
    const database = await this.supabase.readiness();
    if (!database) {
      throw new ServiceUnavailableException({
        code: 'NOT_READY',
        message: 'A critical dependency is unavailable.',
      });
    }
    return { status: 'ready', database: 'reachable', service: 'niagantara-api' };
  }
}

@Module({
  imports: [
    SupabaseModule,
    AuditModule,
    SecurityEventsModule,
    AuthModule,
    CompaniesModule,
    StoresModule,
    BranchesModule,
    ProductsModule,
    CategoriesModule,
    BarcodesModule,
    WarehousesModule,
    InventoryModule,
    PosModule,
    SalesModule,
    ShiftsModule,
    SuppliersModule,
    PurchasesModule,
    CustomersModule,
    EmployeesModule,
    AttendanceModule,
    ExpensesModule,
    FinanceModule,
    GoogleSheetsModule,
    UsersModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

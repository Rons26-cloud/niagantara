import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';
import { ExpensesRepository } from './expenses.repository.js';
@Module({
  controllers: [ExpensesController],
  providers: [
    ExpensesService,
    ExpensesRepository,
    AuthGuard,
    TenantGuard,
    PermissionGuard,
  ],
})
export class ExpensesModule {}

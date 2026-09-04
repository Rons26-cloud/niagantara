import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { FinanceController } from './finance.controller.js';
import { FinanceService } from './finance.service.js';
import { FinanceRepository } from './finance.repository.js';
import { AuditModule } from '../audit/audit.module.js';
@Module({
  imports: [AuditModule],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    FinanceRepository,
    AuthGuard,
    TenantGuard,
    PermissionGuard,
  ],
})
export class FinanceModule {}

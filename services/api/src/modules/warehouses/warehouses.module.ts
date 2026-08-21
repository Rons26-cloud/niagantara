import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { BranchGuard } from '../../common/guards/branch.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { AuditModule } from '../audit/audit.module.js';
import { WarehousesController } from './warehouses.controller.js';
import { WarehousesService } from './warehouses.service.js';
import { WarehousesRepository } from './warehouses.repository.js';
@Module({
  imports: [AuditModule],
  controllers: [WarehousesController],
  providers: [
    WarehousesService,
    WarehousesRepository,
    AuthGuard,
    TenantGuard,
    BranchGuard,
    PermissionGuard,
  ],
})
export class WarehousesModule {}

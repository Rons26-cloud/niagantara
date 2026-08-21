import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { SalesController } from './sales.controller.js';
import { SalesRepository } from './sales.repository.js';
import { SalesService } from './sales.service.js';
@Module({
  controllers: [SalesController],
  providers: [
    SalesService,
    SalesRepository,
    AuthGuard,
    TenantGuard,
    PermissionGuard,
  ],
})
export class SalesModule {}

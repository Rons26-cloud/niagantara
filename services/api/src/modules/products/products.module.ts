import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { AuditModule } from '../audit/audit.module.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { ProductsRepository } from './products.repository.js';
@Module({
  imports: [AuditModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductsRepository,
    AuthGuard,
    TenantGuard,
    PermissionGuard,
  ],
})
export class ProductsModule {}

import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { AuditModule } from '../audit/audit.module.js';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { CategoriesRepository } from './categories.repository.js';
@Module({
  imports: [AuditModule],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    CategoriesRepository,
    AuthGuard,
    TenantGuard,
    PermissionGuard,
  ],
})
export class CategoriesModule {}

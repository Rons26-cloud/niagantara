import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { AuditModule } from '../audit/audit.module.js';
import { CompaniesController } from './companies.controller.js';
import { CompaniesService } from './companies.service.js';

@Module({
  imports: [AuditModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, AuthGuard, TenantGuard, PermissionGuard],
})
export class CompaniesModule {}

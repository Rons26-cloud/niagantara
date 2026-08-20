import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { AuditModule } from '../audit/audit.module.js';
import { StoresController } from './stores.controller.js';
import { StoresService } from './stores.service.js';

@Module({
  imports: [AuditModule],
  controllers: [StoresController],
  providers: [StoresService, AuthGuard, TenantGuard, PermissionGuard],
})
export class StoresModule {}

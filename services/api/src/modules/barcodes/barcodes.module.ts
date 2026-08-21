import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { AuditModule } from '../audit/audit.module.js';
import { BarcodesController } from './barcodes.controller.js';
import { BarcodesService } from './barcodes.service.js';
import { BarcodesRepository } from './barcodes.repository.js';
@Module({
  imports: [AuditModule],
  controllers: [BarcodesController],
  providers: [
    BarcodesService,
    BarcodesRepository,
    AuthGuard,
    TenantGuard,
    PermissionGuard,
  ],
})
export class BarcodesModule {}

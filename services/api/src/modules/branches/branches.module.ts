import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { BranchGuard } from '../../common/guards/branch.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { AuditModule } from '../audit/audit.module.js';
import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';

@Module({
  imports: [AuditModule],
  controllers: [BranchesController],
  providers: [
    BranchesService,
    AuthGuard,
    TenantGuard,
    BranchGuard,
    PermissionGuard,
  ],
})
export class BranchesModule {}

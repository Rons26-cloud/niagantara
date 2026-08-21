import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { BranchGuard } from '../../common/guards/branch.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { PosController } from './pos.controller.js';
import { PosRepository } from './pos.repository.js';
import { PosService } from './pos.service.js';
@Module({
  controllers: [PosController],
  providers: [
    PosService,
    PosRepository,
    AuthGuard,
    TenantGuard,
    BranchGuard,
    PermissionGuard,
  ],
})
export class PosModule {}

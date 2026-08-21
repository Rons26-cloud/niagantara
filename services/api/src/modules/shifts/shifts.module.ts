import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { BranchGuard } from '../../common/guards/branch.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { ShiftsController } from './shifts.controller.js';
import { ShiftsRepository } from './shifts.repository.js';
import { ShiftsService } from './shifts.service.js';
@Module({
  controllers: [ShiftsController],
  providers: [
    ShiftsService,
    ShiftsRepository,
    AuthGuard,
    TenantGuard,
    BranchGuard,
    PermissionGuard,
  ],
})
export class ShiftsModule {}

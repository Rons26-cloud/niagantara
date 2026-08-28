import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/permission.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { BranchGuard } from '../../common/guards/branch.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { InventoryService } from './inventory.service.js';
import type { AdjustmentInput, InventoryQuery, MovementQuery, TransferInput } from './dto/inventory.dto.js';
@Controller('inventory')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class InventoryController {
  constructor(private readonly s: InventoryService) {}
  @Get() @RequirePermission('inventory.read') list(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Query() q: InventoryQuery,
  ) {
    return this.s.list(c, q, r.authz.companyPermissions.includes('inventory.read') ? undefined : r.headers['x-branch-id'] ? [r.headers['x-branch-id']] : []);
  }
  @Get('low-stock') @RequirePermission('inventory.read') low(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Query() q: InventoryQuery,
  ) {
    return this.s.list(c, { ...q, status: 'LOW_STOCK' }, r.authz.companyPermissions.includes('inventory.read') ? undefined : r.headers['x-branch-id'] ? [r.headers['x-branch-id']] : []);
  }
  @Get('movements') @RequirePermission('inventory.read') movements(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Query() q: MovementQuery,
  ) {
    return this.s.movements(c, q, r.authz.companyPermissions.includes('inventory.read') ? undefined : r.headers['x-branch-id'] ? [r.headers['x-branch-id']] : []);
  }
  @Post('adjust')
  @UseGuards(BranchGuard)
  @RequirePermission('inventory.adjust')
  adjust(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: AdjustmentInput,
  ) {
    return this.s.adjust(r.user.id, c, r.tenant.branchId, d);
  }
  @Post('transfer') @RequirePermission('inventory.transfer') transfer(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: TransferInput,
  ) {
    return this.s.transfer(r.user.id, c, d, r.authz.companyPermissions.includes('inventory.transfer') ? undefined : r.headers['x-branch-id'] ? [r.headers['x-branch-id']] : []);
  }
}

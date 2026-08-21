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
import type { AdjustmentInput, TransferInput } from './dto/inventory.dto.js';
@Controller('inventory')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class InventoryController {
  constructor(private readonly s: InventoryService) {}
  @Get() @RequirePermission('inventory.read') list(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Query('branchId') b?: string,
  ) {
    return this.s.list(c, b, false, ['owner', 'company_admin'].includes(r.authz.companyRole) ? undefined : r.authz.branchIds);
  }
  @Get('low-stock') @RequirePermission('inventory.read') low(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Query('branchId') b?: string,
  ) {
    return this.s.list(c, b, true, ['owner', 'company_admin'].includes(r.authz.companyRole) ? undefined : r.authz.branchIds);
  }
  @Get('movements') @RequirePermission('inventory.read') movements(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Query('branchId') b?: string,
  ) {
    return this.s.movements(c, b, ['owner', 'company_admin'].includes(r.authz.companyRole) ? undefined : r.authz.branchIds);
  }
  @Post('adjust')
  @UseGuards(BranchGuard)
  @RequirePermission('inventory.adjust')
  adjust(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: AdjustmentInput,
  ) {
    return this.s.adjust(r.user.id, c, d);
  }
  @Post('transfer') @RequirePermission('inventory.transfer') transfer(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: TransferInput,
  ) {
    return this.s.transfer(r.user.id, c, d, ['owner', 'company_admin'].includes(r.authz.companyRole) ? undefined : r.authz.branchIds);
  }
}

import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
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
import { PurchasesService } from './purchases.service.js';
import type {
  PurchaseInput,
  PurchaseQuery,
  ReceiveInput,
} from './dto/purchase.dto.js';
@Controller('purchases')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class PurchasesController {
  constructor(private readonly s: PurchasesService) {}
  @Get() @RequirePermission('purchase.read') list(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Query() q: PurchaseQuery,
  ) {
    return this.s.list(c, q, r.authz.companyPermissions.includes('purchase.read') ? undefined : r.headers['x-branch-id'] ? [r.headers['x-branch-id']] : []);
  }
  @Get(':id') @RequirePermission('purchase.read') get(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Headers('x-branch-id') b: string | undefined,
    @Param('id') id: string,
  ) {
    return this.s.get(c, id, b, r.authz.companyPermissions.includes('purchase.read') ? undefined : b ? [b] : []);
  }
  @Post() @UseGuards(BranchGuard) @RequirePermission('purchase.create') create(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Headers('x-branch-id') b: string,
    @Body() d: PurchaseInput,
  ) {
    return this.s.create(r.user.id, c, b, d);
  }
  @Post(':id/receive') @RequirePermission('purchase.receive') receive(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Headers('x-branch-id') b: string | undefined,
    @Param('id') id: string,
    @Body() d: ReceiveInput,
  ) {
    return this.s.receive(r.user.id, c, b, id, d, r.authz.companyPermissions.includes('purchase.receive') ? undefined : b ? [b] : []);
  }
  @Post(':id/cancel') @RequirePermission('purchase.cancel') cancel(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Headers('x-branch-id') b: string | undefined,
    @Param('id') id: string,
    @Body() d: { reason: string },
  ) {
    return this.s.cancel(r.user.id, c, b, id, d.reason, r.authz.companyPermissions.includes('purchase.cancel') ? undefined : b ? [b] : []);
  }
}

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
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { SalesService } from './sales.service.js';
import type {
  CancelSaleInput,
  RefundSaleInput,
  SaleQuery,
} from './dto/sale.dto.js';
@Controller('sales')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class SalesController {
  constructor(private readonly s: SalesService) {}
  private branches(r: any) {
    return ['owner', 'company_admin'].includes(r.authz.companyRole)
      ? undefined
      : r.authz.branchIds;
  }
  @Get() @RequirePermission('sale.read') list(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Query() q: SaleQuery,
  ) {
    return this.s.list(c, q, this.branches(r));
  }
  @Get(':id') @RequirePermission('sale.read') detail(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
  ) {
    return this.s.detail(c, id, this.branches(r));
  }
  @Post(':id/cancel') @RequirePermission('sale.cancel') cancel(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
    @Body() d: CancelSaleInput,
  ) {
    return this.s.cancel(c, r.user.id, id, d.reason, this.branches(r));
  }
  @Post(':id/refunds') @RequirePermission('sale.refund') refund(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
    @Body() d: RefundSaleInput,
  ) {
    return this.s.refund(c, r.user.id, id, d, this.branches(r));
  }
}

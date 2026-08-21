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
import { PosService } from './pos.service.js';
import type { CheckoutInput } from './dto/pos.dto.js';
@Controller('pos')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class PosController {
  constructor(private readonly service: PosService) {}
  @Get('products')
  @UseGuards(BranchGuard)
  @RequirePermission('pos.access')
  lookup(
    @Headers('x-company-id') c: string,
    @Headers('x-branch-id') b: string,
    @Query('warehouseId') w: string,
    @Query('search') q = '',
    @Query('categoryId') categoryId?: string,
  ) {
    return this.service.lookup(c, b, w, q, categoryId);
  }
  @Get('barcode')
  @UseGuards(BranchGuard)
  @RequirePermission('pos.access')
  barcode(
    @Headers('x-company-id') c: string,
    @Headers('x-branch-id') b: string,
    @Query('warehouseId') w: string,
    @Query('code') code: string,
  ) {
    return this.service.barcode(c, b, w, code);
  }
  @Post('checkout')
  @UseGuards(BranchGuard)
  @RequirePermission('pos.checkout')
  checkout(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Headers('x-branch-id') b: string,
    @Body() dto: CheckoutInput,
  ) {
    return this.service.checkout(r.user.id, c, b, dto, r.authz.permissions);
  }
}

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
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { BarcodesService } from './barcodes.service.js';
import type { BarcodeInput } from './dto/barcode.dto.js';
@Controller('barcodes')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class BarcodesController {
  constructor(private readonly s: BarcodesService) {}
  @Get('lookup') @RequirePermission('barcode.read') lookup(
    @Headers('x-company-id') c: string,
    @Query('code') code: string,
  ) {
    return this.s.lookup(c, code);
  }
  @Post() @RequirePermission('barcode.generate') create(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: BarcodeInput,
  ) {
    return this.s.create(r.user.id, c, d);
  }
}

import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
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
import { WarehousesService } from './warehouses.service.js';
import type { WarehouseInput } from './dto/warehouse.dto.js';
@Controller('warehouses')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class WarehousesController {
  constructor(private readonly s: WarehousesService) {}
  @Get() @RequirePermission('warehouse.read') list(
    @Headers('x-company-id') c: string,
    @Query('branchId') b?: string,
  ) {
    return this.s.list(c, b);
  }
  @Post() @UseGuards(BranchGuard) @RequirePermission('warehouse.manage') create(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: WarehouseInput,
  ) {
    return this.s.create(r.user.id, c, d);
  }
  @Patch(':id') @RequirePermission('warehouse.manage') update(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
    @Body() d: Partial<WarehouseInput>,
  ) {
    return this.s.update(r.user.id, c, id, d);
  }
}

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
import { ShiftsService } from './shifts.service.js';
import type { CloseShiftInput, OpenShiftInput } from './dto/shift.dto.js';
@Controller('shifts')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class ShiftsController {
  constructor(private readonly s: ShiftsService) {}
  @Get() @RequirePermission('shift.read') list(
    @Headers('x-company-id') c: string,
    @Query('branchId') b?: string,
    @Query('cashierId') u?: string,
  ) {
    return this.s.list(c, b, u);
  }
  @Post('open') @UseGuards(BranchGuard) @RequirePermission('shift.open') open(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: OpenShiftInput,
  ) {
    return this.s.open(c, r.user.id, d);
  }
  @Post(':id/close') @RequirePermission('shift.close') close(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Headers('x-branch-id') b: string | undefined,
    @Param('id') id: string,
    @Body() d: CloseShiftInput,
  ) {
    return this.s.close(c, r.user.id, b, id, d.closingCash);
  }
}

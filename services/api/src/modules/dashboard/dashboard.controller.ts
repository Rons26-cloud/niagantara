import { Controller, Get, Headers, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RequirePermission } from '../../common/decorators/permission.decorator.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardRangeDto } from './dashboard.dto.js';

type DashboardRequest = { authz: { companyRole: string; branchIds: string[] } };

@Controller('dashboard')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}
  @Get('overview') @RequirePermission('sale.read')
  overview(@Req() request: DashboardRequest, @Headers('x-company-id') company: string, @Query() query: DashboardRangeDto) {
    return this.service.overview(company, query, request.authz);
  }

  @Get('command-center') @RequirePermission('sale.read')
  commandCenter(@Req() request: DashboardRequest, @Headers('x-company-id') company: string, @Query() query: DashboardRangeDto) {
    return this.service.commandCenter(company, query, request.authz);
  }
}

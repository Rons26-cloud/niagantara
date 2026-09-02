import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/permission.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import type { UpdateCompanyUserInput } from './dto/user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @RequirePermission('user.read')
  list(
    @Req() request: any,
    @Headers('x-company-id') companyId: string,
    @Headers('x-branch-id') branchId?: string,
  ) {
    return this.service.list(companyId, {
      companyRole: request.authz?.companyRole,
      branchId,
    });
  }

  @Patch(':userId')
  @RequirePermission('user.manage')
  update(
    @Req() request: any,
    @Headers('x-company-id') companyId: string,
    @Param('userId') userId: string,
    @Body() input: UpdateCompanyUserInput,
  ) {
    return this.service.update(
      { id: request.user.id, companyRole: request.authz?.companyRole },
      companyId,
      userId,
      input,
    );
  }
}

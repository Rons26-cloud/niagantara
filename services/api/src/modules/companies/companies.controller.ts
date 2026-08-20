import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/permission.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CompaniesService } from './companies.service.js';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto.js';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  @UseGuards(AuthGuard)
  list(@Req() request: any) { return this.service.list(request.user.id); }

  @Get(':companyId')
  @UseGuards(AuthGuard, TenantGuard, PermissionGuard)
  @RequirePermission('company.read')
  get(@Req() request: any, @Param('companyId') companyId: string) { return this.service.get(request.user.id, companyId); }

  @Post()
  @UseGuards(AuthGuard)
  create(@Req() request: any, @Body() dto: CreateCompanyDto) { return this.service.create(request.user.id, dto); }

  @Patch(':companyId')
  @UseGuards(AuthGuard, TenantGuard, PermissionGuard)
  @RequirePermission('company.update')
  update(@Req() request: any, @Param('companyId') companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.service.update(request.user.id, companyId, dto);
  }
}

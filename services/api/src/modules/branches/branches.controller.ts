import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/permission.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { BranchGuard } from '../../common/guards/branch.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { BranchesService } from './branches.service.js';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto.js';

@Controller('branches')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class BranchesController {
  constructor(private readonly service: BranchesService) {}

  @Get()
  @RequirePermission('branch.read')
  list(@Req() request: any, @Headers('x-company-id') companyId: string) {
    return this.service.list(request.user.id, companyId);
  }

  @Get(':id')
  @UseGuards(BranchGuard)
  @RequirePermission('branch.read')
  get(
    @Req() request: any,
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.get(request.user.id, companyId, id);
  }

  @Post()
  @RequirePermission('branch.manage')
  create(
    @Req() request: any,
    @Headers('x-company-id') companyId: string,
    @Body() dto: CreateBranchDto,
  ) {
    return this.service.create(request.user.id, companyId, dto);
  }

  @Patch(':id')
  @UseGuards(BranchGuard)
  @RequirePermission('branch.manage')
  update(
    @Req() request: any,
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.service.update(request.user.id, companyId, id, dto);
  }
}

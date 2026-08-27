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
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { StoresService } from './stores.service.js';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto.js';

@Controller('stores')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class StoresController {
  constructor(private readonly service: StoresService) {}

  @Get()
  @RequirePermission('store.read')
  list(@Req() request: any, @Headers('x-company-id') companyId: string) {
    return this.service.list(request.user.id, companyId);
  }

  @Get(':id')
  @RequirePermission('store.read')
  get(
    @Req() request: any,
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.get(request.user.id, companyId, id);
  }

  @Post()
  @RequirePermission('store.manage')
  create(
    @Req() request: any,
    @Headers('x-company-id') companyId: string,
    @Body() dto: CreateStoreDto,
  ) {
    return this.service.create(request.user.id, companyId, dto);
  }

  @Patch(':id')
  @RequirePermission('store.manage')
  update(
    @Req() request: any,
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.service.update(request.user.id, companyId, id, dto);
  }
}

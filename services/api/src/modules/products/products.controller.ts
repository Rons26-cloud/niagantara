import {
  Body,
  Controller,
  Delete,
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
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { ProductsService } from './products.service.js';
import type { ProductInput, ProductQuery } from './dto/product.dto.js';
@Controller('products')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class ProductsController {
  constructor(private readonly service: ProductsService) {}
  @Get() @RequirePermission('product.read') list(
    @Headers('x-company-id') c: string,
    @Query() q: ProductQuery,
  ) {
    return this.service.list(c, q);
  }
  @Get(':id') @RequirePermission('product.read') get(
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
  ) {
    return this.service.get(c, id);
  }
  @Post() @RequirePermission('product.create') create(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: ProductInput,
  ) {
    return this.service.create(r.user.id, c, d);
  }
  @Patch(':id') @RequirePermission('product.update') update(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
    @Body() d: ProductInput,
  ) {
    return this.service.update(r.user.id, c, id, d);
  }
  @Delete(':id') @RequirePermission('product.delete') archive(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
  ) {
    return this.service.archive(r.user.id, c, id);
  }
}

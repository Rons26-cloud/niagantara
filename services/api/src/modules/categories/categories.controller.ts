import {
  Body,
  Controller,
  Delete,
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
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { CategoriesService } from './categories.service.js';
import type { CategoryInput } from './dto/category.dto.js';
@Controller('categories')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class CategoriesController {
  constructor(private readonly s: CategoriesService) {}
  @Get() @RequirePermission('category.read') list(
    @Headers('x-company-id') c: string,
  ) {
    return this.s.list(c);
  }
  @Post() @RequirePermission('category.manage') create(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: CategoryInput,
  ) {
    return this.s.create(r.user.id, c, d);
  }
  @Patch(':id') @RequirePermission('category.manage') update(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
    @Body() d: CategoryInput,
  ) {
    return this.s.update(r.user.id, c, id, d);
  }
  @Delete(':id') @RequirePermission('category.manage') archive(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
  ) {
    return this.s.archive(r.user.id, c, id);
  }
}

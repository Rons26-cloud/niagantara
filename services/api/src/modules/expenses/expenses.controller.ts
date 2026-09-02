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
import { ExpensesService } from './expenses.service.js';
import type {
  CategoryInput,
  ExpenseInput,
  ExpenseQuery,
} from './dto/expense.dto.js';
@Controller('expenses')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class ExpensesController {
  constructor(private readonly s: ExpensesService) {}
  @Get() @RequirePermission('expense.read') list(
    @Headers('x-company-id') c: string,
    @Query() q: ExpenseQuery,
  ) {
    return this.s.list(c, q);
  }
  @Get('categories') @RequirePermission('expense.read') categories(
    @Headers('x-company-id') c: string,
  ) {
    return this.s.categories(c);
  }
  @Post('categories') @RequirePermission('expense.manage') category(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: CategoryInput,
  ) {
    return this.s.category(c, r.user.id, d);
  }
  @Post() @RequirePermission('expense.create') create(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: ExpenseInput,
  ) {
    return this.s.create(c, r.user.id, d);
  }
}

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
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { FinanceService } from './finance.service.js';
import type { FinanceQuery, PaymentInput } from './dto/finance.dto.js';
@Controller('finance')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class FinanceController {
  constructor(private readonly s: FinanceService) {}
  @Get('payables') @RequirePermission('payable.read') payables(
    @Headers('x-company-id') c: string,
  ) {
    return this.s.payables(c);
  }
  @Post('payables/:id/payments') @RequirePermission('payable.manage') payable(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
    @Body() d: PaymentInput,
  ) {
    return this.s.payable(c, r.user.id, id, d);
  }
  @Get('receivables') @RequirePermission('receivable.read') receivables(
    @Headers('x-company-id') c: string,
  ) {
    return this.s.receivables(c);
  }
  @Post('receivables/:id/payments')
  @RequirePermission('receivable.manage')
  receivable(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
    @Body() d: PaymentInput,
  ) {
    return this.s.receivable(c, r.user.id, id, d);
  }
  @Get('reports') @RequirePermission('finance.read') report(
    @Headers('x-company-id') c: string,
    @Query() q: FinanceQuery,
  ) {
    return this.s.report(c, q);
  }
}

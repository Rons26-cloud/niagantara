import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  Res,
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
    @Req() r: any,
    @Headers('x-company-id') c: string,
  ) {
    return this.s.payables(c, r.authz);
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
    @Req() r: any,
    @Headers('x-company-id') c: string,
  ) {
    return this.s.receivables(c, r.authz);
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
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Query() q: FinanceQuery,
  ) {
    return this.s.report(c, q, r.authz);
  }
  @Get('reports/export/pdf') @RequirePermission('finance.read') async exportPdf(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Query() q: FinanceQuery,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.s.export(c, q, { ...r.authz, actorUserId: r.user?.id }, 'pdf');
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', `attachment; filename="${result.filename}"`);
    return result.buffer;
  }
  @Get('reports/export/xlsx') @RequirePermission('finance.read') async exportXlsx(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Query() q: FinanceQuery,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.s.export(c, q, { ...r.authz, actorUserId: r.user?.id }, 'xlsx');
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', `attachment; filename="${result.filename}"`);
    return result.buffer;
  }
}

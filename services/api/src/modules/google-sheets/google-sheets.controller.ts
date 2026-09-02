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
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { GoogleSheetsService } from './google-sheets.service.js';
import {
  CreateWorkbookDto,
  DefinitionDto,
  ColumnDto,
  OAuthReplaceDto,
  UpdateDefinitionDto,
  UpdateColumnDto,
} from './google-sheets.dto.js';

@Controller('google-sheets')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class GoogleSheetsController {
  constructor(private readonly s: GoogleSheetsService) {}

  @Get()
  @RequirePermission('sheet.read')
  status(@Headers('x-company-id') c: string) {
    return this.s.status(c);
  }

  @Post('oauth/start')
  @RequirePermission('sheet.manage')
  oauth(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: OAuthReplaceDto,
  ) {
    return this.s.oauthStart(c, r.user.id, Boolean(d.replace));
  }

  @Post('workbooks')
  @RequirePermission('sheet.manage')
  workbook(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: CreateWorkbookDto,
  ) {
    return this.s.createWorkbook(c, r.user.id, d);
  }

  @Post('definitions')
  @RequirePermission('sheet.manage')
  definition(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Body() d: DefinitionDto,
  ) {
    return this.s.addDefinition(c, r.user.id, d);
  }

  @Patch('definitions/:id')
  @RequirePermission('sheet.manage')
  updateDefinition(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
    @Body() d: UpdateDefinitionDto,
  ) {
    return this.s.updateDefinition(c, r.user.id, id, d);
  }

  @Post('definitions/:id/columns')
  @RequirePermission('sheet.manage')
  column(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
    @Body() d: ColumnDto,
  ) {
    return this.s.addColumn(c, r.user.id, id, d);
  }

  @Patch('columns/:id')
  @RequirePermission('sheet.manage')
  updateColumn(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
    @Body() d: UpdateColumnDto,
  ) {
    return this.s.updateColumn(c, r.user.id, id, d);
  }

  @Get('history')
  @RequirePermission('sheet.read')
  history(@Headers('x-company-id') c: string) {
    return this.s.history(c);
  }

  @Get('recovery')
  @RequirePermission('sheet.manage')
  recovery(@Headers('x-company-id') c: string) {
    return this.s.recovery(c);
  }

  @Post('recovery/:id/retry')
  @RequirePermission('sheet.manage')
  retry(
    @Req() r: any,
    @Headers('x-company-id') c: string,
    @Param('id') id: string,
  ) {
    return this.s.retry(c, r.user.id, id);
  }

  @Post('rebuild')
  @RequirePermission('sheet.manage')
  rebuild(@Req() r: any, @Headers('x-company-id') c: string) {
    return this.s.rebuild(c, r.user.id);
  }
}

@Controller('google-sheets/oauth')
export class GoogleOAuthCallbackController {
  constructor(private readonly s: GoogleSheetsService) {}

  @Get('callback')
  callback(@Query('code') code: string, @Query('state') state: string) {
    return this.s.callback(code, state);
  }
}

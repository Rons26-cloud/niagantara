import { Body, Controller, Get, Headers, Inject, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyRecoveryDto } from './dto/auth.dto.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(@Inject(AuthService) private readonly service: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Headers('x-request-id') suppliedRequestId?: string) {
    const requestId = suppliedRequestId && /^[A-Za-z0-9_-]{1,128}$/.test(suppliedRequestId)
      ? suppliedRequestId
      : randomUUID();
    this.logger.log(JSON.stringify({
      request_id: requestId,
      operation: 'auth.register',
      register_stage: 'CONTROLLER_ENTER',
    }));
    return this.service.register(dto, requestId);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Headers('authorization') auth: string) {
    return this.service.logout(auth.slice(7));
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() req: any) {
    return this.service.me(req.user.id);
  }

  @Post('forgot-password')
  forgot(@Body() dto: ForgotPasswordDto, @Headers('x-request-id') suppliedRequestId?: string) {
    const requestId = suppliedRequestId && /^[A-Za-z0-9_-]{1,128}$/.test(suppliedRequestId)
      ? suppliedRequestId
      : randomUUID();
    for (const stage of ['ROUTE_MATCH', 'DTO_PARSED', 'DTO_VALIDATED', 'CONTROLLER_ENTER', 'SERVICE_CALL_START']) {
      this.logger.log(JSON.stringify({
        request_id: requestId,
        operation: 'auth.forgot_password',
        forgot_password_stage: stage,
      }));
    }
    return this.service.forgotPassword(dto, requestId);
  }

  @Post('verify-recovery')
  verifyRecovery(@Body() dto: VerifyRecoveryDto) {
    return this.service.verifyRecovery(dto);
  }

  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto, @Headers('authorization') authorization?: string) {
    return this.service.resetPassword(dto, authorization);
  }
}

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class MasterGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!request.authz?.platformRole) {
      throw new ForbiddenException({ code: 'MASTER_ACCESS_DENIED', message: 'Platform-level access is required.' });
    }
    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class MasterGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const platformRole = request.authz?.platformRole as string | null;
    if (!platformRole) {
      throw new ForbiddenException({
        code: 'MASTER_ACCESS_DENIED',
        message: 'Platform-level access is required.',
      });
    }
    request.platformRole = platformRole;
    return true;
  }
}

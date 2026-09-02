import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';

const PLATFORM_ROLES = new Set([
  'super_master',
  'master_admin',
  'support',
  'auditor',
]);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(SupabaseService) private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;
    if (!header?.startsWith('Bearer ') || header.length <= 7) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required.',
      });
    }

    const { data, error } = await this.supabase.client.auth.getUser(
      header.slice(7),
    );
    if (error || !data.user) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required.',
      });
    }

    const claimedPlatformRole = data.user.app_metadata?.platform_role;
    let platformRole: string | null = null;
    if (
      typeof claimedPlatformRole === 'string' &&
      PLATFORM_ROLES.has(claimedPlatformRole)
    ) {
      const { data: roleRows, error: roleError } = await this.supabase.client
        .from('roles')
        .select('scope')
        .eq('role_key', claimedPlatformRole)
        .eq('scope', 'platform')
        .limit(1);
      if (!roleError && roleRows?.length) {
        platformRole = claimedPlatformRole;
      }
    }
    request.user = data.user;
    request.authz = {
      permissions: [],
      platformRole,
    };
    return true;
  }
}

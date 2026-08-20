import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const companyId = request.headers['x-company-id'] ?? request.params.companyId;
    if (typeof companyId !== 'string' || !companyId) {
      throw new BadRequestException({ code: 'COMPANY_CONTEXT_REQUIRED', message: 'x-company-id is required.' });
    }

    const { data: membership, error } = await this.supabase.client
      .from('company_members')
      .select('role_key')
      .eq('company_id', companyId)
      .eq('user_id', request.user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (error || !membership) {
      throw new ForbiddenException({ code: 'TENANT_ACCESS_DENIED', message: 'You do not have access to this company.' });
    }

    const { data: role } = await this.supabase.client
      .from('roles')
      .select('id')
      .eq('scope', 'company')
      .eq('role_key', membership.role_key)
      .maybeSingle();
    const { data: assignments } = role
      ? await this.supabase.client.from('role_permissions').select('permission:permissions(permission_key)').eq('role_id', role.id)
      : { data: [] };
    const permissions = (assignments ?? [])
      .map((assignment: { permission: { permission_key?: string } | { permission_key?: string }[] | null }) => {
        const permission = Array.isArray(assignment.permission) ? assignment.permission[0] : assignment.permission;
        return permission?.permission_key;
      })
      .filter((permission): permission is string => Boolean(permission));

    request.tenant = { ...(request.tenant ?? {}), companyId };
    request.authz = { ...(request.authz ?? {}), companyRole: membership.role_key, permissions };
    return true;
  }
}

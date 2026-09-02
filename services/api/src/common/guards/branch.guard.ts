import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';

@Injectable()
export class BranchGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const branchId =
      request.params.branchId ??
      request.params.id ??
      request.headers['x-branch-id'];
    const companyId = request.tenant?.companyId;
    if (typeof branchId !== 'string' || !branchId) {
      throw new BadRequestException({
        code: 'BRANCH_CONTEXT_REQUIRED',
        message: 'Branch context is required.',
      });
    }
    if (typeof companyId !== 'string' || !companyId) {
      throw new BadRequestException({
        code: 'COMPANY_CONTEXT_REQUIRED',
        message: 'Company context is required before branch authorization.',
      });
    }

    const { data, error } = await this.supabase.client
      .from('branches')
      .select('id,company_id')
      .eq('id', branchId)
      .maybeSingle();
    if (error || !data || data.company_id !== companyId) {
      throw new ForbiddenException({
        code: 'BRANCH_ACCESS_DENIED',
        message: 'Branch does not belong to the active company.',
      });
    }
    const companyRole = request.authz?.companyRole as string | undefined;
    if (!['owner', 'company_admin'].includes(companyRole ?? '')) {
      const { data: assignment, error: assignmentError } =
        await this.supabase.client
          .from('branch_members')
          .select('id,role_key')
          .eq('company_id', companyId)
          .eq('branch_id', branchId)
          .eq('user_id', request.user.id)
          .eq('status', 'active')
          .maybeSingle();
      if (assignmentError || !assignment) {
        throw new ForbiddenException({
          code: 'BRANCH_ACCESS_DENIED',
          message: 'You do not have access to this branch.',
        });
      }
      request.authz = { ...request.authz, branchRole: assignment.role_key };
    }
    request.tenant = { ...request.tenant, branchId };
    return true;
  }
}

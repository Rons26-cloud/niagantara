import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';

@Injectable()
export class BranchGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const branchId = request.params.branchId ?? request.params.id ?? request.headers['x-branch-id'];
    const companyId = request.tenant?.companyId;
    if (typeof branchId !== 'string' || !branchId) {
      throw new BadRequestException({ code: 'BRANCH_CONTEXT_REQUIRED', message: 'Branch context is required.' });
    }
    if (typeof companyId !== 'string' || !companyId) {
      throw new BadRequestException({ code: 'COMPANY_CONTEXT_REQUIRED', message: 'Company context is required before branch authorization.' });
    }

    const { data, error } = await this.supabase.client.from('branches').select('id,company_id').eq('id', branchId).maybeSingle();
    if (error || !data || data.company_id !== companyId) {
      throw new ForbiddenException({ code: 'BRANCH_ACCESS_DENIED', message: 'Branch does not belong to the active company.' });
    }
    request.tenant = { ...request.tenant, branchId };
    return true;
  }
}

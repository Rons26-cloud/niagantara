import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
@Injectable()
export class AuditService {
  constructor(private readonly db: SupabaseService) {}
  async record(input: {
    action: string;
    resourceType: string;
    resourceId?: string;
    actorUserId?: string;
    companyId?: string;
    branchId?: string;
    requestId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const { error } = await this.db.client
      .from('audit_logs')
      .insert({
        action: input.action,
        resource_type: input.resourceType,
        resource_id: input.resourceId,
        actor_user_id: input.actorUserId,
        company_id: input.companyId,
        branch_id: input.branchId,
        request_id: input.requestId,
        metadata: input.metadata ?? {},
      });
    if (error) throw error;
    return { recorded: true };
  }
}

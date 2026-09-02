import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
@Injectable()
export class SecurityEventsService {
  constructor(private readonly db: SupabaseService) {}
  async record(
    eventType: string,
    input: {
      userId?: string;
      companyId?: string;
      requestId?: string;
      severity?: 'info' | 'warning' | 'critical';
      metadata?: Record<string, unknown>;
    } = {},
  ) {
    const { error } = await this.db.client
      .from('security_events')
      .insert({
        event_type: eventType,
        actor_user_id: input.userId,
        company_id: input.companyId,
        request_id: input.requestId,
        severity: input.severity ?? 'warning',
        metadata: input.metadata ?? {},
      });
    if (error) throw error;
    return { recorded: true };
  }
}

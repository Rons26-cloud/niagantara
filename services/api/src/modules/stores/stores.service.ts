import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { CreateStoreDto, UpdateStoreDto } from './dto/store.dto.js';

@Injectable()
export class StoresService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async list(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    const { data, error } = await this.db.client
      .from('stores')
      .select('*')
      .eq('company_id', companyId);
    if (error) throw error;
    return data ?? [];
  }

  async get(userId: string, companyId: string, id: string) {
    await this.assertMember(userId, companyId);
    const { data, error } = await this.db.client
      .from('stores')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Store not found.',
      });
    if (data.company_id !== companyId) {
      throw new ForbiddenException({
        code: 'TENANT_RELATION_INVALID',
        message: 'Store does not belong to the active company.',
      });
    }
    return data;
  }

  async create(userId: string, companyId: string, dto: CreateStoreDto) {
    await this.assertMember(userId, companyId);
    const { data, error } = await this.db.client
      .from('stores')
      .insert({ company_id: companyId, name: dto.name })
      .select()
      .single();
    if (error) throw error;
    await this.audit.record({
      action: 'store.create',
      resourceType: 'store',
      resourceId: data.id,
      actorUserId: userId,
      companyId,
    });
    return data;
  }

  async update(
    userId: string,
    companyId: string,
    id: string,
    dto: UpdateStoreDto,
  ) {
    await this.get(userId, companyId, id);
    // Keep the database write allowlisted even if controller validation is ever bypassed.
    const { data, error } = await this.db.client
      .from('stores')
      .update({ name: dto.name })
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();
    if (error) throw error;
    await this.audit.record({
      action: 'store.update',
      resourceType: 'store',
      resourceId: id,
      actorUserId: userId,
      companyId,
    });
    return data;
  }

  private async assertMember(userId: string, companyId: string) {
    const { data } = await this.db.client
      .from('company_members')
      .select('id')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    if (!data)
      throw new ForbiddenException({
        code: 'TENANT_ACCESS_DENIED',
        message: 'You do not have access to this company.',
      });
  }
}

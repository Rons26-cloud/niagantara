import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class BranchesService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async list(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    const { data, error } = await this.db.client.from('branches').select('*').eq('company_id', companyId);
    if (error) throw error;
    return data ?? [];
  }

  async get(userId: string, companyId: string, id: string) {
    await this.assertMember(userId, companyId);
    const { data, error } = await this.db.client.from('branches').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Branch not found.' });
    if (data.company_id !== companyId) {
      throw new ForbiddenException({ code: 'TENANT_RELATION_INVALID', message: 'Branch does not belong to the active company.' });
    }
    return data;
  }

  async create(userId: string, companyId: string, dto: { storeId: string; name: string; code: string }) {
    await this.assertMember(userId, companyId);
    const { data: store } = await this.db.client.from('stores').select('company_id').eq('id', dto.storeId).maybeSingle();
    if (!store || store.company_id !== companyId) {
      throw new BadRequestException({ code: 'TENANT_RELATION_INVALID', message: 'Store does not belong to the active company.' });
    }
    const { data, error } = await this.db.client.from('branches').insert({ company_id: companyId, store_id: dto.storeId, name: dto.name, code: dto.code }).select().single();
    if (error) throw error;
    await this.audit.record({ action: 'branch.create', resourceType: 'branch', resourceId: data.id, actorUserId: userId, companyId, branchId: data.id });
    return data;
  }

  async update(userId: string, companyId: string, id: string, dto: { name?: string; status?: string }) {
    await this.get(userId, companyId, id);
    const { data, error } = await this.db.client.from('branches').update(dto).eq('id', id).eq('company_id', companyId).select().single();
    if (error) throw error;
    await this.audit.record({ action: 'branch.update', resourceType: 'branch', resourceId: id, actorUserId: userId, companyId, branchId: id });
    return data;
  }

  private async assertMember(userId: string, companyId: string) {
    const { data } = await this.db.client.from('company_members').select('id').eq('company_id', companyId).eq('user_id', userId).eq('status', 'active').maybeSingle();
    if (!data) throw new ForbiddenException({ code: 'TENANT_ACCESS_DENIED', message: 'You do not have access to this company.' });
  }
}

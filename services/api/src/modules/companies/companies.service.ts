import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto.js';

const MAX_COMPANIES_PER_USER = 5;

@Injectable()
export class CompaniesService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async list(userId: string) {
    const { data, error } = await this.db.client.from('company_members').select('company:companies(*)').eq('user_id', userId).eq('status', 'active');
    if (error) throw error;
    return (data ?? []).map((row: { company: unknown }) => row.company).filter(Boolean);
  }

  async get(userId: string, id: string) {
    const { data, error } = await this.db.client.from('companies').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Company not found.' });
    await this.assertMember(userId, id);
    return data;
  }

  async create(userId: string, dto: CreateCompanyDto) {
    const { data: limitResult, error: limitError } = await this.db.client.rpc('check_company_limit', {
      p_user_id: userId,
    });
    if (limitError) throw limitError;

    const limit = limitResult as { current_count: number; max_allowed: number; can_create: boolean } | null;
    if (limit && !limit.can_create) {
      throw new BadRequestException({
        code: 'COMPANY_LIMIT_REACHED',
        message: `You have reached the maximum of ${limit.max_allowed} companies. Please upgrade your plan or contact support.`,
      });
    }

    const { data, error } = await this.db.client.rpc('provision_company', {
      p_user_id: userId,
      p_company_name: dto.name,
      p_legal_name: dto.legalName ?? null,
      p_full_name: null,
    });
    if (error) throw error;
    return (data as { company?: unknown })?.company ?? data;
  }

  async update(userId: string, id: string, dto: UpdateCompanyDto) {
    await this.assertRole(userId, id, ['owner', 'company_admin']);
    const { data, error } = await this.db.client.from('companies').update(dto).eq('id', id).select().single();
    if (error) throw error;
    await this.audit.record({ action: 'company.update', resourceType: 'company', resourceId: id, actorUserId: userId, companyId: id });
    return data;
  }

  async getPlanLimits(userId: string, companyId: string) {
    await this.assertMember(userId, companyId);
    const { data, error } = await this.db.client.from('companies').select('plan,plan_limits').eq('id', companyId).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException({ code: 'RESOURCE_NOT_FOUND', message: 'Company not found.' });
    return data;
  }

  private async assertMember(userId: string, companyId: string) {
    const { data } = await this.db.client.from('company_members').select('id').eq('company_id', companyId).eq('user_id', userId).eq('status', 'active').maybeSingle();
    if (!data) throw new ForbiddenException({ code: 'TENANT_ACCESS_DENIED', message: 'You do not have access to this company.' });
  }

  private async assertRole(userId: string, companyId: string, roles: string[]) {
    const { data } = await this.db.client.from('company_members').select('role_key').eq('company_id', companyId).eq('user_id', userId).eq('status', 'active').maybeSingle();
    if (!data || !roles.includes(data.role_key)) throw new ForbiddenException({ code: 'PERMISSION_DENIED', message: 'You do not have permission to perform this action.' });
  }
}

import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: SupabaseService) {}

  list(companyId: string) {
    return this.db.client
      .from('company_members')
      .select(
        'id,user_id,role_key,status,created_at,profile:profiles(id,full_name,avatar_url)',
      )
      .eq('company_id', companyId)
      .order('created_at');
  }

  get(companyId: string, userId: string) {
    return this.db.client
      .from('company_members')
      .select(
        'id,user_id,role_key,status,created_at,profile:profiles(id,full_name,avatar_url)',
      )
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .maybeSingle();
  }

  listBranchMemberships(companyId: string, userId?: string) {
    let query = this.db.client
      .from('branch_members')
      .select(
        'id,user_id,branch_id,role_key,status,branch:branches(id,name,store_id)',
      )
      .eq('company_id', companyId);
    if (userId) query = query.eq('user_id', userId);
    return query;
  }

  companyRole(roleKey: string) {
    return this.db.client
      .from('roles')
      .select('role_key')
      .eq('scope', 'company')
      .eq('role_key', roleKey)
      .maybeSingle();
  }

  branchRoles(roleKeys: string[]) {
    return this.db.client
      .from('roles')
      .select('role_key')
      .eq('scope', 'branch')
      .in('role_key', roleKeys);
  }

  branches(companyId: string, branchIds: string[]) {
    return this.db.client
      .from('branches')
      .select('id')
      .eq('company_id', companyId)
      .in('id', branchIds);
  }

  activeOwnerCount(companyId: string) {
    return this.db.client
      .from('company_members')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('role_key', 'owner')
      .eq('status', 'active');
  }

  updateCompanyMembership(
    companyId: string,
    userId: string,
    values: Record<string, string>,
  ) {
    return this.db.client
      .from('company_members')
      .update(values)
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();
  }

  existingBranches(companyId: string, userId: string) {
    return this.db.client
      .from('branch_members')
      .select('branch_id,role_key,status')
      .eq('company_id', companyId)
      .eq('user_id', userId);
  }

  upsertBranches(rows: Record<string, string>[]) {
    return this.db.client
      .from('branch_members')
      .upsert(rows, { onConflict: 'branch_id,user_id' });
  }
}

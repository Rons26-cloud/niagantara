import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: SupabaseService) {}

  createAuthUser(input: { email: string; password: string; fullName: string }) {
    return this.db.client.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    });
  }

  deleteAuthUser(userId: string) {
    return this.db.client.auth.admin.deleteUser(userId);
  }

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

  updateAccessAtomic(input: {
    companyId: string;
    userId: string;
    actorId: string;
    roleKey?: string;
    status?: string;
    branches?: Array<{ branchId: string; roleKey: string; status?: string }>;
  }) {
    return this.db.client.rpc('update_company_user_access', {
      target_company_id: input.companyId,
      target_user_id: input.userId,
      actor_id: input.actorId,
      target_role_key: input.roleKey ?? null,
      target_status: input.status ?? null,
      branch_assignments: input.branches
        ? input.branches.map((branch) => ({
            branch_id: branch.branchId,
            role_key: branch.roleKey,
            status: branch.status ?? 'active',
          }))
        : null,
    });
  }

  provisionCashierAccess(input: {
    companyId: string;
    userId: string;
    branchId: string;
    fullName: string;
    actorId: string;
  }) {
    return this.db.client.rpc('provision_cashier_access', {
      target_company_id: input.companyId,
      target_user_id: input.userId,
      target_branch_id: input.branchId,
      target_full_name: input.fullName,
      actor_id: input.actorId,
    });
  }

  revokeCashierAccess(companyId: string, userId: string, actorId: string) {
    return this.db.client.rpc('revoke_cashier_access', {
      target_company_id: companyId,
      target_user_id: userId,
      actor_id: actorId,
    });
  }

  existingBranches(companyId: string, userId: string) {
    return this.db.client
      .from('branch_members')
      .select('branch_id,role_key,status')
      .eq('company_id', companyId)
      .eq('user_id', userId);
  }

  branch(companyId: string, branchId: string) {
    return this.db.client
      .from('branches')
      .select('id,name')
      .eq('company_id', companyId)
      .eq('id', branchId)
      .eq('status', 'active')
      .maybeSingle();
  }
}

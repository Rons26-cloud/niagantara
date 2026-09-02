import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const companyId =
      request.headers['x-company-id'] ?? request.params.companyId;
    if (typeof companyId !== 'string' || !companyId) {
      throw new BadRequestException({
        code: 'COMPANY_CONTEXT_REQUIRED',
        message: 'x-company-id is required.',
      });
    }
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        companyId,
      )
    ) {
      throw new BadRequestException({
        code: 'INVALID_COMPANY_ID',
        message: 'x-company-id must be a valid UUID.',
      });
    }

    const { data: membership, error } = await this.supabase.client
      .from('company_members')
      .select('role_key')
      .eq('company_id', companyId)
      .eq('user_id', request.user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (error || !membership) {
      throw new ForbiddenException({
        code: 'TENANT_ACCESS_DENIED',
        message: 'You do not have access to this company.',
      });
    }

    const { data: role } = await this.supabase.client
      .from('roles')
      .select('id')
      .eq('scope', 'company')
      .eq('role_key', membership.role_key)
      .maybeSingle();
    const { data: assignments } = role
      ? await this.supabase.client
          .from('role_permissions')
          .select('permission:permissions(permission_key)')
          .eq('role_id', role.id)
      : { data: [] };
    const permissions = (assignments ?? [])
      .map(
        (assignment: {
          permission:
            { permission_key?: string } | { permission_key?: string }[] | null;
        }) => {
          const permission = Array.isArray(assignment.permission)
            ? assignment.permission[0]
            : assignment.permission;
          return permission?.permission_key;
        },
      )
      .filter((permission): permission is string => Boolean(permission));
    const companyPermissions = [...permissions];

    const { data: branchMemberships } = await this.supabase.client
      .from('branch_members')
      .select('branch_id,role_key')
      .eq('company_id', companyId)
      .eq('user_id', request.user.id)
      .eq('status', 'active');
    const selectedBranchId = request.headers['x-branch-id'];
    if (
      selectedBranchId !== undefined &&
      (typeof selectedBranchId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          selectedBranchId,
        ))
    ) {
      throw new BadRequestException({
        code: 'INVALID_BRANCH_ID',
        message: 'x-branch-id must be a valid UUID.',
      });
    }
    const selectedMembership =
      typeof selectedBranchId === 'string'
        ? (branchMemberships ?? []).find(
            (member: { branch_id: string }) =>
              member.branch_id === selectedBranchId,
          )
        : undefined;
    if (selectedBranchId && !selectedMembership) {
      const isCompanyAdministrator = ['owner', 'company_admin'].includes(
        membership.role_key,
      );
      const { data: selectedBranch } = isCompanyAdministrator
        ? await this.supabase.client
            .from('branches')
            .select('id')
            .eq('id', selectedBranchId)
            .eq('company_id', companyId)
            .maybeSingle()
        : { data: null };
      if (!selectedBranch) {
        throw new ForbiddenException({
          code: 'BRANCH_ACCESS_DENIED',
          message: 'You do not have access to the selected branch.',
        });
      }
    }
    const branchRoleKeys = selectedMembership
      ? [selectedMembership.role_key]
      : [];
    if (branchRoleKeys.length > 0) {
      const { data: branchRoles } = await this.supabase.client
        .from('roles')
        .select('id')
        .eq('scope', 'branch')
        .in('role_key', branchRoleKeys);
      const roleIds = (branchRoles ?? []).map(
        (item: { id: string }) => item.id,
      );
      if (roleIds.length > 0) {
        const { data: branchAssignments } = await this.supabase.client
          .from('role_permissions')
          .select('permission:permissions(permission_key)')
          .in('role_id', roleIds);
        for (const assignment of branchAssignments ?? []) {
          const value = Array.isArray(assignment.permission)
            ? assignment.permission[0]
            : assignment.permission;
          if (
            value?.permission_key &&
            !permissions.includes(value.permission_key)
          )
            permissions.push(value.permission_key);
        }
      }
    }

    request.tenant = { ...(request.tenant ?? {}), companyId };
    request.authz = {
      ...(request.authz ?? {}),
      companyRole: membership.role_key,
      branchIds: (branchMemberships ?? []).map(
        (member: { branch_id: string }) => member.branch_id,
      ),
      companyPermissions,
      permissions,
    };
    return true;
  }
}

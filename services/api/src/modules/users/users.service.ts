import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import type {
  CreatePosCashierInput,
  UpdateCompanyUserInput,
} from './dto/user.dto.js';
import { UsersRepository } from './users.repository.js';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly audit: AuditService,
  ) {}

  async list(
    companyId: string,
    scope: { companyRole?: string; branchId?: string },
  ) {
    const [{ data, error }, { data: branches, error: branchError }] =
      await Promise.all([
        this.repo.list(companyId),
        this.repo.listBranchMemberships(companyId),
      ]);
    if (error) throw error;
    if (branchError) throw branchError;
    const visibleBranches = ['owner', 'company_admin'].includes(
      scope.companyRole ?? '',
    )
      ? (branches ?? [])
      : (branches ?? []).filter(
          (branch: { branch_id: string }) =>
            branch.branch_id === scope.branchId,
        );
    const visibleUsers = new Set(
      visibleBranches.map((branch: { user_id: string }) => branch.user_id),
    );
    return (data ?? [])
      .filter(
        (member: { user_id: string }) =>
          ['owner', 'company_admin'].includes(scope.companyRole ?? '') ||
          visibleUsers.has(member.user_id),
      )
      .map((member: { user_id: string }) => ({
        ...member,
        branches: visibleBranches.filter(
          (branch: { user_id: string }) => branch.user_id === member.user_id,
        ),
      }));
  }

  async update(
    actor: { id: string; companyRole?: string },
    companyId: string,
    userId: string,
    input: UpdateCompanyUserInput,
  ) {
    if (!UUID.test(userId))
      throw new BadRequestException({
        code: 'INVALID_USER_ID',
        message: 'User ID must be a valid UUID.',
      });
    if (!['owner', 'company_admin'].includes(actor.companyRole ?? '')) {
      throw new ForbiddenException({
        code: 'USER_MANAGEMENT_DENIED',
        message: 'Only company owners and administrators can manage users.',
      });
    }
    if (
      input.status &&
      !['active', 'invited', 'suspended'].includes(input.status)
    ) {
      throw new BadRequestException({
        code: 'INVALID_MEMBER_STATUS',
        message: 'Unknown membership status.',
      });
    }
    if (
      input.branches &&
      new Set(input.branches.map((item) => item.branchId)).size !==
        input.branches.length
    ) {
      throw new BadRequestException({
        code: 'DUPLICATE_BRANCH_ASSIGNMENT',
        message: 'A branch may only be assigned once.',
      });
    }
    const { data: target, error: targetError } = await this.repo.get(
      companyId,
      userId,
    );
    if (targetError) throw targetError;
    if (!target)
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User does not belong to the active company.',
      });
    if (target.role_key === 'owner' && actor.companyRole !== 'owner') {
      throw new ForbiddenException({
        code: 'OWNER_MANAGEMENT_DENIED',
        message: 'Only an owner can change an owner membership.',
      });
    }
    if (input.roleKey === 'owner' && actor.companyRole !== 'owner') {
      throw new ForbiddenException({
        code: 'OWNER_ASSIGNMENT_DENIED',
        message: 'Only an owner can assign the owner role.',
      });
    }
    if (
      target.role_key === 'owner' &&
      ((input.status && input.status !== 'active') ||
        (input.roleKey && input.roleKey !== 'owner'))
    ) {
      const { count } = await this.repo.activeOwnerCount(companyId);
      if ((count ?? 0) <= 1)
        throw new BadRequestException({
          code: 'LAST_OWNER_REQUIRED',
          message: 'The final active owner cannot be removed.',
        });
    }

    // Validate all branch relations before mutating company membership so a
    // rejected request cannot leave a partial authorization change behind.
    if (input.branches) {
      const ids = [...new Set(input.branches.map((item) => item.branchId))];
      if (ids.some((id) => !UUID.test(id)))
        throw new BadRequestException({
          code: 'INVALID_BRANCH_ID',
          message: 'Every branch ID must be a valid UUID.',
        });
      const roleKeys = [...new Set(input.branches.map((item) => item.roleKey))];
      const [{ data: branches }, { data: roles }] = await Promise.all([
        ids.length
          ? this.repo.branches(companyId, ids)
          : Promise.resolve({ data: [] }),
        roleKeys.length
          ? this.repo.branchRoles(roleKeys)
          : Promise.resolve({ data: [] }),
      ]);
      if ((branches ?? []).length !== ids.length)
        throw new BadRequestException({
          code: 'TENANT_RELATION_INVALID',
          message: 'A selected branch does not belong to the active company.',
        });
      if ((roles ?? []).length !== roleKeys.length)
        throw new BadRequestException({
          code: 'INVALID_BRANCH_ROLE',
          message: 'Unknown branch role.',
        });
      const { error: existingError } = await this.repo.existingBranches(
        companyId,
        userId,
      );
      if (existingError) throw existingError;
    }

    const membershipValues: Record<string, string> = {};
    if (input.roleKey) {
      const { data: role } = await this.repo.companyRole(input.roleKey);
      if (!role)
        throw new BadRequestException({
          code: 'INVALID_COMPANY_ROLE',
          message: 'Unknown company role.',
        });
      membershipValues.role_key = input.roleKey;
    }
    if (input.status) membershipValues.status = input.status;
    if (Object.keys(membershipValues).length) {
      const { data, error } = await this.repo.updateCompanyMembership(
        companyId,
        userId,
        membershipValues,
      );
      if (error) throw error;
      if (!data)
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: 'User does not belong to the active company.',
        });
    }

    if (input.branches) {
      const ids = [...new Set(input.branches.map((item) => item.branchId))];
      if (ids.some((id) => !UUID.test(id)))
        throw new BadRequestException({
          code: 'INVALID_BRANCH_ID',
          message: 'Every branch ID must be a valid UUID.',
        });
      const roleKeys = [...new Set(input.branches.map((item) => item.roleKey))];
      const [{ data: branches }, { data: roles }] = await Promise.all([
        ids.length
          ? this.repo.branches(companyId, ids)
          : Promise.resolve({ data: [] }),
        roleKeys.length
          ? this.repo.branchRoles(roleKeys)
          : Promise.resolve({ data: [] }),
      ]);
      if ((branches ?? []).length !== ids.length)
        throw new BadRequestException({
          code: 'TENANT_RELATION_INVALID',
          message: 'A selected branch does not belong to the active company.',
        });
      if ((roles ?? []).length !== roleKeys.length)
        throw new BadRequestException({
          code: 'INVALID_BRANCH_ROLE',
          message: 'Unknown branch role.',
        });
      const { data: existing, error: existingError } =
        await this.repo.existingBranches(companyId, userId);
      if (existingError) throw existingError;
      const requested = new Map(
        input.branches.map((item) => [item.branchId, item]),
      );
      const rows = [
        ...input.branches.map((item) => ({
          company_id: companyId,
          branch_id: item.branchId,
          user_id: userId,
          role_key: item.roleKey,
          status: item.status ?? 'active',
        })),
        ...(existing ?? [])
          .filter(
            (item: { branch_id: string }) => !requested.has(item.branch_id),
          )
          .map((item: { branch_id: string; role_key: string }) => ({
            company_id: companyId,
            branch_id: item.branch_id,
            user_id: userId,
            role_key: item.role_key,
            status: 'suspended',
          })),
      ];
      if (rows.length) {
        const { error } = await this.repo.upsertBranches(rows);
        if (error) throw error;
      }
    }

    await this.audit.record({
      action: 'company_user.updated',
      resourceType: 'company_member',
      resourceId: target.id,
      actorUserId: actor.id,
      companyId,
      metadata: { target_user_id: userId, fields: Object.keys(input) },
    });
    const [{ data, error }, { data: branches, error: branchError }] =
      await Promise.all([
        this.repo.get(companyId, userId),
        this.repo.listBranchMemberships(companyId, userId),
      ]);
    if (error) throw error;
    if (branchError) throw branchError;
    return data ? { ...data, branches: branches ?? [] } : data;
  }

  async createCashier(
    actor: { id: string; companyRole?: string },
    companyId: string,
    input: CreatePosCashierInput,
  ) {
    if (!['owner', 'company_admin'].includes(actor.companyRole ?? '')) {
      throw new ForbiddenException({
        code: 'USER_MANAGEMENT_DENIED',
        message:
          'Only company owners and administrators can manage POS cashiers.',
      });
    }
    const email = input.email.trim().toLowerCase();
    const { data: branch, error: branchError } = await this.repo.branch(
      companyId,
      input.branchId,
    );
    if (branchError) throw branchError;
    if (!branch)
      throw new BadRequestException({
        code: 'INVALID_BRANCH_ID',
        message: 'The selected branch does not belong to the active company.',
      });

    const { data: authData, error: authError } = await this.repo.createAuthUser(
      { email, password: input.password, fullName: input.fullName.trim() },
    );
    if (authError || !authData.user) {
      throw new BadRequestException({
        code: 'CASHIER_CREATE_FAILED',
        message: authError?.message ?? 'Cashier account could not be created.',
      });
    }
    const userId = authData.user.id;
    try {
      const { error: profileError } = await this.repo.insertProfile({
        id: userId,
        full_name: input.fullName.trim(),
      });
      if (profileError) throw profileError;
      const { error: memberError } = await this.repo.insertCompanyMember({
        company_id: companyId,
        user_id: userId,
        role_key: 'employee',
        status: 'active',
      });
      if (memberError) throw memberError;
      const { error: branchMemberError } = await this.repo.insertBranchMember({
        company_id: companyId,
        branch_id: input.branchId,
        user_id: userId,
        role_key: 'cashier',
        status: 'active',
      });
      if (branchMemberError) throw branchMemberError;
    } catch (error) {
      await this.repo.deleteAuthUser(userId);
      throw new BadRequestException({
        code: 'CASHIER_PROVISIONING_FAILED',
        message: 'Cashier account could not be provisioned.',
      });
    }
    await this.audit.record({
      action: 'pos_cashier.created',
      resourceType: 'user',
      resourceId: userId,
      actorUserId: actor.id,
      companyId,
      metadata: { branch_id: input.branchId },
    });
    return {
      userId,
      email,
      fullName: input.fullName.trim(),
      branchId: input.branchId,
      branchName: branch.name,
      posPath: '/#pos',
    };
  }

  async removeCashier(
    actor: { id: string; companyRole?: string },
    companyId: string,
    userId: string,
  ) {
    if (!UUID.test(userId))
      throw new BadRequestException({
        code: 'INVALID_USER_ID',
        message: 'User ID must be a valid UUID.',
      });
    if (!['owner', 'company_admin'].includes(actor.companyRole ?? ''))
      throw new ForbiddenException({
        code: 'USER_MANAGEMENT_DENIED',
        message:
          'Only company owners and administrators can manage POS cashiers.',
      });
    const { data: memberships, error } = await this.repo.cashierMembership(
      companyId,
      userId,
    );
    if (error) throw error;
    if (!memberships?.length)
      throw new NotFoundException({
        code: 'CASHIER_NOT_FOUND',
        message: 'POS cashier access was not found.',
      });
    const { error: suspendError } = await this.repo.suspendCashier(
      companyId,
      userId,
    );
    if (suspendError) throw suspendError;
    await this.audit.record({
      action: 'pos_cashier.removed',
      resourceType: 'user',
      resourceId: userId,
      actorUserId: actor.id,
      companyId,
      metadata: {
        branch_ids: memberships.map(
          (membership: { branch_id: string }) => membership.branch_id,
        ),
      },
    });
    return { success: true };
  }
}

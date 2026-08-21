import { HttpException, HttpStatus, Inject, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, VerifyRecoveryDto } from './dto/auth.dto.js';
import { RecoveryCooldown, recoveryOtpException } from './recovery-security.js';
import {
  classifyForgotPasswordFailure,
  forgotPasswordException,
  forgotPasswordLog,
} from './forgot-password-error.js';
import {
  classifyRegistrationError,
  registrationErrorLog,
  registrationHttpException,
  upstreamAuthErrorFromUnknown,
} from './registration-error.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly recoveryCooldown = new RecoveryCooldown();

  constructor(@Inject(SupabaseService) private readonly supabase: SupabaseService) {}

  async register(dto: RegisterDto, requestId: string = randomUUID()) {
    this.registrationStage(requestId, 'SERVICE_ENTER');
    this.registrationStage(requestId, 'AUTH_CLIENT_READY');
    let authResult;
    try {
      this.registrationStage(requestId, 'BEFORE_SIGNUP');
      authResult = await this.supabase.authClient.auth.signUp({
        email: dto.email,
        password: dto.password,
        options: { data: { full_name: dto.fullName ?? null } },
      });
    } catch (error) {
      const classification = classifyRegistrationError(upstreamAuthErrorFromUnknown(error));
      this.logger.warn(JSON.stringify(registrationErrorLog(classification, requestId)));
      throw registrationHttpException(classification);
    }

    this.registrationStage(requestId, 'AFTER_SIGNUP');
    const { data: authData, error: authError } = authResult;

    if (authError || !authData.user) {
      const classification = classifyRegistrationError(authError);
      this.logger.warn(JSON.stringify(registrationErrorLog(classification, requestId)));
      throw registrationHttpException(classification);
    }

    this.registrationStage(requestId, 'BEFORE_PROVISIONING');
    const { data: provisioning, error: provisioningError } = await this.supabase.client.rpc(
      'provision_company',
      {
        p_user_id: authData.user.id,
        p_company_name: dto.companyName,
        p_legal_name: null,
        p_full_name: dto.fullName ?? null,
      },
    );

    if (provisioningError) {
      const { error: cleanupError } = await this.supabase.client.auth.admin.deleteUser(authData.user.id);
      if (cleanupError) {
        throw new ServiceUnavailableException({
          code: 'REGISTRATION_REQUIRES_RECOVERY',
          message: 'Account creation needs administrative recovery before retry.',
        });
      }
      throw new ServiceUnavailableException({
        code: 'PROVISIONING_FAILED',
        message: 'Company provisioning failed; the incomplete Auth account was removed safely.',
      });
    }

    return {
      user: authData.user,
      session: authData.session,
      provisioning,
      provisioningStatus: 'completed',
      emailConfirmationRequired: !authData.session,
      transactionBoundary: 'auth_then_atomic_database_provisioning',
    };
  }

  private registrationStage(requestId: string, stage: string) {
    this.logger.log(JSON.stringify({
      request_id: requestId,
      operation: 'auth.register',
      register_stage: stage,
    }));
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.authClient.auth.signInWithPassword(dto);
    if (error || !data.user) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }
    return { user: data.user, session: data.session };
  }

  async logout(accessToken: string) {
    const { error } = await this.supabase.client.auth.admin.signOut(accessToken);
    if (error) {
      throw new UnauthorizedException({ code: 'INVALID_SESSION', message: 'Session could not be revoked.' });
    }
    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto, requestId: string = randomUUID()) {
    this.logger.log(JSON.stringify({
      request_id: requestId,
      operation: 'auth.forgot_password',
      forgot_password_stage: 'SERVICE_ENTER',
    }));
    const email = dto.email.trim().toLowerCase();
    this.logger.log(JSON.stringify({
      request_id: requestId,
      operation: 'auth.forgot_password',
      forgot_password_stage: 'COOLDOWN_CHECK_START',
    }));
    this.recoveryCooldown.assertAllowed(email);
    this.logger.log(JSON.stringify({
      request_id: requestId,
      operation: 'auth.forgot_password',
      forgot_password_stage: 'COOLDOWN_CHECK_PASS',
    }));
    this.logger.log(JSON.stringify({
      request_id: requestId,
      operation: 'auth.forgot_password',
      forgot_password_stage: 'BEFORE_SUPABASE_RECOVERY_REQUEST',
    }));
    let result;
    try {
      result = await this.supabase.authClient.auth.resetPasswordForEmail(email);
    } catch (error) {
      const failure = classifyForgotPasswordFailure(error);
      this.logger.warn(JSON.stringify(forgotPasswordLog(failure, requestId)));
      throw forgotPasswordException(failure);
    }
    if (result.error) {
      const failure = classifyForgotPasswordFailure(result.error);
      this.logger.warn(JSON.stringify(forgotPasswordLog(failure, requestId)));
      throw forgotPasswordException(failure);
    }
    this.logger.log(JSON.stringify({
      request_id: requestId,
      operation: 'auth.forgot_password',
      forgot_password_stage: 'AFTER_SUPABASE_RECOVERY_REQUEST',
    }));
    return { accepted: true };
  }

  async verifyRecovery(dto: VerifyRecoveryDto) {
    const { data, error } = await this.supabase.authClient.auth.verifyOtp({
      email: dto.email.trim().toLowerCase(),
      token: dto.otp,
      type: 'recovery',
    });
    if (error || !data.user || !data.session?.access_token || !data.session.refresh_token) {
      throw recoveryOtpException(error);
    }
    return { recoverySession: true, accessToken: data.session.access_token, refreshToken: data.session.refresh_token };
  }

  async resetPassword(dto: ResetPasswordDto, authorization?: string) {
    if (dto.password !== dto.confirmPassword) {
      throw new HttpException(
        { code: 'PASSWORD_MISMATCH', message: 'Password confirmation does not match.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!accessToken) {
      throw new UnauthorizedException({
        code: 'RECOVERY_SESSION_REQUIRED',
        message: 'A valid recovery session is required.',
      });
    }
    const recoveryClient = this.supabase.createUserAuthClient();
    const { data: sessionData, error: sessionError } = await recoveryClient.auth.setSession({
      access_token: accessToken,
      refresh_token: dto.refreshToken,
    });
    if (sessionError || !sessionData.user || !sessionData.session) {
      throw new UnauthorizedException({
        code: 'RECOVERY_SESSION_REQUIRED',
        message: 'A valid recovery session is required.',
      });
    }

    const { error: updateError } = await recoveryClient.auth.updateUser({
      password: dto.password,
    });
    if (updateError) {
      throw new ServiceUnavailableException({ code: 'PASSWORD_RESET_FAILED', message: 'Password could not be updated.' });
    }

    await recoveryClient.auth.signOut({ scope: 'global' });
    return { success: true };
  }

  async me(userId: string) {
    const { data: profile } = await this.supabase.client.from('profiles').select('*').eq('id', userId).maybeSingle();
    const { data: companies } = await this.supabase.client
      .from('company_members')
      .select('company_id,role_key,status')
      .eq('user_id', userId)
      .eq('status', 'active');
    const memberships = companies ?? [];
    const activeMembership = memberships[0] as { company_id: string; role_key: string } | undefined;
    const activeCompanyId = activeMembership?.company_id ?? null;
    const activeRoleKey = activeMembership?.role_key ?? null;

    let branchMemberships: { branch_id: string; role_key: string }[] = [];
    if (activeCompanyId) {
      const { data } = await this.supabase.client
        .from('branch_members')
        .select('branch_id,role_key')
        .eq('company_id', activeCompanyId)
        .eq('user_id', userId)
        .eq('status', 'active');
      branchMemberships = data ?? [];
    }

    let permissions: string[] = [];
    if (activeRoleKey) {
      const { data: roleRows } = await this.supabase.client
        .from('roles')
        .select('id,role_key')
        .eq('scope', 'company')
        .eq('role_key', activeRoleKey);
      const roleIds = (roleRows ?? []).map((role: { id: string }) => role.id);
      if (roleIds.length > 0) {
        const { data: assignments } = await this.supabase.client
          .from('role_permissions')
          .select('permission:permissions(permission_key)')
          .in('role_id', roleIds);
        permissions = [...new Set((assignments ?? []).flatMap((assignment: {
          permission: { permission_key: string } | { permission_key: string }[] | null;
        }) => {
          const permission = assignment.permission;
          if (Array.isArray(permission)) return permission.map((item) => item.permission_key);
          return permission?.permission_key ? [permission.permission_key] : [];
        }))].sort();
      }
    }
    const branchRoleKeys = [...new Set(branchMemberships.map((membership) => membership.role_key))];
    if (branchRoleKeys.length > 0) {
      const { data: branchRoles } = await this.supabase.client
        .from('roles')
        .select('id,role_key')
        .eq('scope', 'branch')
        .in('role_key', branchRoleKeys);
      const branchRoleIds = (branchRoles ?? []).map((role: { id: string }) => role.id);
      if (branchRoleIds.length > 0) {
        const { data: assignments } = await this.supabase.client
          .from('role_permissions')
          .select('permission:permissions(permission_key)')
          .in('role_id', branchRoleIds);
        const branchPermissions = (assignments ?? []).flatMap((assignment: {
          permission: { permission_key: string } | { permission_key: string }[] | null;
        }) => {
          if (Array.isArray(assignment.permission)) return assignment.permission.map((item) => item.permission_key);
          return assignment.permission?.permission_key ? [assignment.permission.permission_key] : [];
        });
        permissions = [...new Set([...permissions, ...branchPermissions])].sort();
      }
    }

    let stores: unknown[] = [];
    let accessibleBranches: unknown[] = [];
    if (activeCompanyId) {
      const { data: storeRows } = await this.supabase.client
        .from('stores')
        .select('id,company_id,name')
        .eq('company_id', activeCompanyId);
      stores = storeRows ?? [];
    }
    if (activeCompanyId && ['owner', 'company_admin'].includes(activeRoleKey ?? '')) {
      const { data: branches } = await this.supabase.client
        .from('branches')
        .select('id,company_id,store_id,name,code,status')
        .eq('company_id', activeCompanyId)
        .eq('status', 'active');
      accessibleBranches = branches ?? [];
    } else if (branchMemberships.length > 0) {
      const { data: branches } = await this.supabase.client
        .from('branches')
        .select('id,company_id,store_id,name,code,status')
        .in('id', branchMemberships.map((membership) => membership.branch_id))
        .eq('status', 'active');
      accessibleBranches = branches ?? [];
    }

    return {
      user: { id: userId },
      profile,
      companies: memberships,
      active_company: activeCompanyId,
      roles: [...new Set([...(activeRoleKey ? [activeRoleKey] : []), ...branchRoleKeys])],
      permissions,
      stores,
      accessible_branches: accessibleBranches,
    };
  }
}

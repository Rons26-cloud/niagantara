import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async register(dto: RegisterDto) {
    const { data: authData, error: authError } = await this.supabase.authClient.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: { data: { full_name: dto.fullName ?? null } },
    });

    if (authError || !authData.user) {
      throw new ConflictException({ code: 'REGISTER_FAILED', message: 'Unable to create account.' });
    }

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

  async forgotPassword(dto: ForgotPasswordDto) {
    await this.supabase.client.auth.resetPasswordForEmail(dto.email);
    return { accepted: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { data, error } = await this.supabase.client.auth.getUser(dto.token);
    if (error || !data.user) {
      throw new UnauthorizedException({ code: 'INVALID_RECOVERY_TOKEN', message: 'Recovery token is invalid or expired.' });
    }

    const { error: updateError } = await this.supabase.client.auth.admin.updateUserById(data.user.id, {
      password: dto.password,
    });
    if (updateError) {
      throw new ServiceUnavailableException({ code: 'PASSWORD_RESET_FAILED', message: 'Password could not be updated.' });
    }

    await this.supabase.client.auth.admin.signOut(dto.token, 'global');
    return { success: true };
  }

  async me(userId: string) {
    const { data: profile } = await this.supabase.client.from('profiles').select('*').eq('id', userId).maybeSingle();
    const { data: companies } = await this.supabase.client
      .from('company_members')
      .select('company_id,role_key,status')
      .eq('user_id', userId)
      .eq('status', 'active');
    return {
      user: { id: userId },
      profile,
      companies: companies ?? [],
      active_company: null,
      roles: (companies ?? []).map((membership: { role_key: string }) => membership.role_key),
      permissions: [],
      accessible_branches: [],
    };
  }
}

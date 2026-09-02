import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateServerEnvironment } from '../../config/environment.js';

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;
  readonly authClient: SupabaseClient;
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor() {
    const environment = validateServerEnvironment();
    this.supabaseUrl = environment.supabaseUrl;
    this.supabaseAnonKey = environment.supabaseAnonKey;
    this.client = createClient(
      environment.supabaseUrl,
      environment.supabaseServiceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );
    this.authClient = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  createUserAuthClient(): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  async readiness(): Promise<boolean> {
    const { error } = await this.client.from('companies').select('id').limit(1);
    return !error;
  }
}

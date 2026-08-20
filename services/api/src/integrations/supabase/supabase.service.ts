import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateServerEnvironment } from '../../config/environment.js';

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    const environment = validateServerEnvironment();
    this.client = createClient(environment.supabaseUrl, environment.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
}

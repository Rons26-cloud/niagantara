import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
@Injectable()
export class SupabaseService { readonly client: SupabaseClient; constructor(){ const url=process.env.SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY; this.client=createClient(url??'http://127.0.0.1:54321',key??'phase1-not-configured',{auth:{autoRefreshToken:false,persistSession:false}}); } }
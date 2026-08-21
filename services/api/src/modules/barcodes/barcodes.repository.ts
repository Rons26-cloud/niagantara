import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
@Injectable()
export class BarcodesRepository {
  constructor(private readonly db: SupabaseService) {}
  find(c: string, code: string) {
    return this.db.client
      .from('barcodes')
      .select('*,product:products(*)')
      .eq('company_id', c)
      .eq('code', code)
      .eq('active', true)
      .maybeSingle();
  }
  create(v: Record<string, unknown>) {
    return this.db.client.from('barcodes').insert(v).select().single();
  }
}

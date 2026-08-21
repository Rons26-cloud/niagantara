import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
@Injectable()
export class ShiftsRepository {
  constructor(private readonly db: SupabaseService) {}
  list(c: string, b?: string, cashier?: string) {
    let q = this.db.client
      .from('cashier_shifts')
      .select('*')
      .eq('company_id', c)
      .order('opened_at', { ascending: false });
    if (b) q = q.eq('branch_id', b);
    if (cashier) q = q.eq('cashier_id', cashier);
    return q;
  }
  open(
    c: string,
    u: string,
    d: { storeId: string; branchId: string; openingCash: number },
  ) {
    return this.db.client.rpc('open_cashier_shift', {
      target_company_id: c,
      target_store_id: d.storeId,
      target_branch_id: d.branchId,
      actor_id: u,
      target_opening_cash: d.openingCash,
    });
  }
  close(c: string, u: string, id: string, closingCash: number) {
    return this.db.client.rpc('close_cashier_shift', {
      target_company_id: c,
      target_shift_id: id,
      actor_id: u,
      target_closing_cash: closingCash,
    });
  }
}

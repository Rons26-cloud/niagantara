import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import type { RefundSaleInput, SaleQuery } from './dto/sale.dto.js';
@Injectable()
export class SalesRepository {
  constructor(private readonly db: SupabaseService) {}
  list(c: string, q: SaleQuery, branches?: string[]) {
    let x = this.db.client
      .from('sales')
      .select(
        '*,payment:payments(method,status,amount,amount_received,change_amount),items:sale_items(product_id,product_name,quantity,line_total)',
      )
      .eq('company_id', c)
      .order('created_at', { ascending: false })
      .range(
        Math.max(0, Number(q.offset ?? 0)),
        Math.max(0, Number(q.offset ?? 0)) +
          Math.min(100, Math.max(1, Number(q.limit ?? 50))) -
          1,
      );
    if (q.search)
      x = x.ilike('transaction_number', `%${q.search.replace(/[%_]/g, '')}%`);
    if (q.branchId) x = x.eq('branch_id', q.branchId);
    else if (branches) x = x.in('branch_id', branches);
    if (q.cashierId) x = x.eq('cashier_id', q.cashierId);
    if (q.status) x = x.eq('status', q.status);
    if (q.from) x = x.gte('created_at', q.from);
    if (q.to) x = x.lte('created_at', q.to);
    return x;
  }
  detail(c: string, id: string) {
    return this.db.client
      .from('sales')
      .select(
        '*,items:sale_items(*),payment:payments(*),history:sale_status_history(*),refunds(*,items:refund_items(*)),branch:branches(id,name,code),store:stores(id,name),cashier:profiles(id,full_name)',
      )
      .eq('company_id', c)
      .eq('id', id)
      .maybeSingle();
  }
  cancel(c: string, u: string, id: string, reason: string) {
    return this.db.client.rpc('cancel_sale', {
      target_company_id: c,
      target_sale_id: id,
      actor_id: u,
      target_reason: reason,
    });
  }
  refund(c: string, u: string, id: string, d: RefundSaleInput) {
    return this.db.client.rpc('refund_sale', {
      target_company_id: c,
      target_sale_id: id,
      actor_id: u,
      target_reason: d.reason,
      items: d.items,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import type { FinanceQuery, PaymentInput } from './dto/finance.dto.js';
@Injectable()
export class FinanceRepository {
  constructor(private readonly db: SupabaseService) {}
  payables(c: string) {
    return this.db.client
      .from('payables')
      .select(
        '*,supplier:suppliers(id,name),purchase:purchases(id,purchase_number,branch_id)',
      )
      .eq('company_id', c)
      .order('created_at', { ascending: false });
  }
  receivables(c: string) {
    return this.db.client
      .from('receivables')
      .select(
        '*,customer:customers(id,name),sale:sales(id,transaction_number,branch_id)',
      )
      .eq('company_id', c)
      .order('created_at', { ascending: false });
  }
  payPayable(c: string, u: string, id: string, d: PaymentInput) {
    return this.db.client.rpc('record_payable_payment', {
      target_company_id: c,
      target_payable_id: id,
      target_amount: d.amount,
      target_method: d.paymentMethod,
      actor_id: u,
      target_idempotency_key: d.idempotencyKey,
    });
  }
  payReceivable(c: string, u: string, id: string, d: PaymentInput) {
    return this.db.client.rpc('record_receivable_payment', {
      target_company_id: c,
      target_receivable_id: id,
      target_amount: d.amount,
      target_method: d.paymentMethod,
      actor_id: u,
      target_idempotency_key: d.idempotencyKey,
    });
  }
  async report(c: string, f: FinanceQuery) {
    let q = this.db.client
      .from('financial_transactions')
      .select('event_type,direction,amount,occurred_at,branch_id,store_id')
      .eq('company_id', c)
      .order('occurred_at', { ascending: false })
      .limit(1000);
    if (f.branchId) q = q.eq('branch_id', f.branchId);
    if (f.storeId) q = q.eq('store_id', f.storeId);
    if (f.from) q = q.gte('occurred_at', f.from);
    if (f.to) q = q.lte('occurred_at', f.to + 'T23:59:59.999Z');
    return q;
  }
}

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
  async report(c: string, f: FinanceQuery, branchIds?: string[]) {
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
    if (branchIds) q = q.in('branch_id', branchIds);

    let sales = this.db.client
      .from('sales')
      .select('id,transaction_number,company_id,store_id,branch_id,cashier_id,status,subtotal,item_discount_total,transaction_discount,tax_total,grand_total,refunded_total,created_at,payment:payments(method,status,amount),customer:customers(id,name)')
      .eq('company_id', c)
      .in('status', ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'])
      .order('created_at', { ascending: false })
      .limit(5000);
    let expenses = this.db.client
      .from('expenses')
      .select('id,company_id,store_id,branch_id,category_id,amount,expense_date,description,payment_method,reference,status,created_by,created_at,category:expense_categories(id,name),branch:branches(id,name)')
      .eq('company_id', c)
      .eq('status', 'RECORDED')
      .order('expense_date', { ascending: false })
      .limit(5000);
    let payables = this.db.client
      .from('payables')
      .select('id,company_id,supplier_id,purchase_id,original_amount,paid_amount,remaining_amount,due_date,status,created_at,supplier:suppliers(id,name),purchase:purchases(id,purchase_number,branch_id,purchase_date)')
      .eq('company_id', c)
      .neq('status', 'CANCELLED')
      .limit(5000);
    let receivables = this.db.client
      .from('receivables')
      .select('id,company_id,customer_id,sale_id,original_amount,paid_amount,remaining_amount,due_date,status,created_at,customer:customers(id,name),sale:sales(id,transaction_number,branch_id,created_at)')
      .eq('company_id', c)
      .neq('status', 'CANCELLED')
      .limit(5000);
    if (branchIds) {
      sales = sales.in('branch_id', branchIds);
      expenses = expenses.in('branch_id', branchIds);
    }
    if (f.from) {
      sales = sales.gte('created_at', `${f.from}T00:00:00.000Z`);
      expenses = expenses.gte('expense_date', f.from);
    }
    if (f.to) {
      sales = sales.lte('created_at', `${f.to}T23:59:59.999Z`);
      expenses = expenses.lte('expense_date', f.to);
    }
    const [ledger, salesResult, expensesResult, payablesResult, receivablesResult] = await Promise.all([
      q,
      sales,
      expenses,
      payables,
      receivables,
    ]);
    return {
      ledger: ledger.data ?? [],
      ledgerError: ledger.error,
      sales: salesResult.data ?? [],
      salesError: salesResult.error,
      expenses: expensesResult.data ?? [],
      expensesError: expensesResult.error,
      payables: payablesResult.data ?? [],
      payablesError: payablesResult.error,
      receivables: receivablesResult.data ?? [],
      receivablesError: receivablesResult.error,
    };
  }
}

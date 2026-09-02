import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import type {
  CategoryInput,
  ExpenseInput,
  ExpenseQuery,
} from './dto/expense.dto.js';
@Injectable()
export class ExpensesRepository {
  constructor(private readonly db: SupabaseService) {}
  async list(c: string, f: ExpenseQuery) {
    let q = this.db.client
      .from('expenses')
      .select('*,category:expense_categories(id,name),branch:branches(id,name)')
      .eq('company_id', c)
      .order('expense_date', { ascending: false })
      .limit(100);
    if (f.branchId) q = q.eq('branch_id', f.branchId);
    if (f.categoryId) q = q.eq('category_id', f.categoryId);
    if (f.from) q = q.gte('expense_date', f.from);
    if (f.to) q = q.lte('expense_date', f.to);
    return q;
  }
  categories(c: string) {
    return this.db.client
      .from('expense_categories')
      .select('*')
      .eq('company_id', c)
      .order('name');
  }
  createCategory(c: string, u: string, d: CategoryInput) {
    return this.db.client
      .from('expense_categories')
      .insert({
        company_id: c,
        created_by: u,
        name: d.name,
        description: d.description ?? null,
      })
      .select()
      .single();
  }
  create(c: string, u: string, d: ExpenseInput) {
    return this.db.client.rpc('record_expense', {
      target_company_id: c,
      target_store_id: d.storeId ?? null,
      target_branch_id: d.branchId ?? null,
      target_category_id: d.categoryId,
      target_amount: d.amount,
      target_date: d.expenseDate,
      target_description: d.description,
      target_payment_method: d.paymentMethod,
      target_reference: d.reference ?? null,
      actor_id: u,
      target_idempotency_key: d.idempotencyKey,
    });
  }
}

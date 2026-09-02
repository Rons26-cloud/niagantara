import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import type { CustomerInput, CustomerQuery } from './dto/customer.dto.js';
@Injectable()
export class CustomersRepository {
  constructor(private readonly db: SupabaseService) {}
  async list(c: string, q: CustomerQuery) {
    let x = this.db.client
      .from('customers')
      .select('*')
      .eq('company_id', c)
      .order('name')
      .limit(Math.min(Number(q.limit ?? 50), 100));
    if (q.status) x = x.eq('status', q.status);
    if (q.search)
      x = x.or(
        `name.ilike.%${q.search.replace(/[%_,]/g, '')}%,customer_code.ilike.%${q.search.replace(/[%_,]/g, '')}%`,
      );
    return x;
  }
  get(c: string, id: string) {
    return this.db.client
      .from('customers')
      .select('*,sales(id,transaction_number,status,grand_total,created_at)')
      .eq('company_id', c)
      .eq('id', id)
      .maybeSingle();
  }
  create(c: string, u: string, d: CustomerInput) {
    return this.db.client
      .from('customers')
      .insert({
        company_id: c,
        created_by: u,
        customer_code: d.customerCode,
        name: d.name,
        phone: d.phone ?? null,
        email: d.email ?? null,
        address: d.address ?? null,
        notes: d.notes ?? null,
        status: d.status ?? 'active',
      })
      .select()
      .single();
  }
  update(c: string, id: string, d: Partial<CustomerInput>) {
    return this.db.client
      .from('customers')
      .update({
        customer_code: d.customerCode,
        name: d.name,
        phone: d.phone,
        email: d.email,
        address: d.address,
        notes: d.notes,
        status: d.status,
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', c)
      .eq('id', id)
      .select()
      .single();
  }
}

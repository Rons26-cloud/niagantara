import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import type { WarehouseInput } from './dto/warehouse.dto.js';
@Injectable()
export class WarehousesRepository {
  constructor(private readonly db: SupabaseService) {}
  list(c: string, b?: string, allowedBranches?: string[]) {
    let q = this.db.client
      .from('warehouses')
      .select('*,branch:branches(id,name),store:stores(id,name)')
      .eq('company_id', c)
      .order('name');
    if (b) q = q.eq('branch_id', b);
    else if (allowedBranches) q = q.in('branch_id', allowedBranches);
    return q;
  }
  get(c: string, id: string) {
    return this.db.client.from('warehouses').select('id,branch_id').eq('company_id', c).eq('id', id).maybeSingle();
  }
  relations(c: string, d: WarehouseInput) {
    return Promise.all([
      this.db.client
        .from('stores')
        .select('id,company_id')
        .eq('id', d.storeId)
        .eq('company_id', c)
        .maybeSingle(),
      this.db.client
        .from('branches')
        .select('id,company_id,store_id')
        .eq('id', d.branchId)
        .eq('company_id', c)
        .maybeSingle(),
    ]);
  }
  create(c: string, u: string, d: WarehouseInput) {
    return this.db.client
      .from('warehouses')
      .insert({
        company_id: c,
        created_by: u,
        store_id: d.storeId,
        branch_id: d.branchId,
        name: d.name,
        code: d.code,
        is_main: d.isMain ?? false,
        status: d.status ?? 'active',
      })
      .select()
      .single();
  }
  update(c: string, id: string, d: Partial<WarehouseInput>) {
    return this.db.client
      .from('warehouses')
      .update({
        name: d.name,
        code: d.code,
        is_main: d.isMain,
        status: d.status,
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', c)
      .eq('id', id)
      .select()
      .single();
  }
}

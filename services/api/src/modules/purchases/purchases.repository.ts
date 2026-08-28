import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import type {
  PurchaseInput,
  PurchaseQuery,
  ReceiveInput,
} from './dto/purchase.dto.js';
@Injectable()
export class PurchasesRepository {
  constructor(private readonly db: SupabaseService) {}
  async list(c: string, q: PurchaseQuery, allowedBranches?: string[]) {
    const limit = Math.min(Math.max(Number(q.limit) || 50, 1), 100);
    const offset = Math.max(Number(q.offset) || 0, 0);
    let x = this.db.client
      .from('purchases')
      .select(
        '*,supplier:suppliers(id,name,supplier_code),branch:branches(id,name),warehouse:warehouses(id,name)',
      )
      .eq('company_id', c)
      .order('purchase_date', { ascending: false })
      .range(offset, offset + limit - 1);
    if (q.status) x = x.eq('status', q.status);
    if (q.branchId) x = x.eq('branch_id', q.branchId);
    else if (allowedBranches) x = x.in('branch_id', allowedBranches);
    if (q.supplierId) x = x.eq('supplier_id', q.supplierId);
    if (q.from) x = x.gte('purchase_date', q.from);
    if (q.to) x = x.lte('purchase_date', q.to);
    if (q.search)
      x = x.ilike('purchase_number', `%${q.search.replace(/[%_]/g, '')}%`);
    return x;
  }
  get(c: string, id: string, branchId?: string, allowedBranches?: string[]) {
    let query = this.db.client
      .from('purchases')
      .select(
        '*,supplier:suppliers(*),branch:branches(id,name),warehouse:warehouses(id,name),items:purchase_items(*,product:products(id,name,sku)),history:purchase_status_history(*),receipts:purchase_receipts(*,items:purchase_receipt_items(*)),payable:payables(*)',
      )
      .eq('company_id', c)
      .eq('id', id);
    if (branchId) query = query.eq('branch_id', branchId);
    else if (allowedBranches) query = query.in('branch_id', allowedBranches);
    return query.maybeSingle();
  }
  create(c: string, u: string, d: PurchaseInput) {
    return this.db.client.rpc('create_purchase', {
      target_company_id: c,
      target_store_id: d.storeId,
      target_branch_id: d.branchId,
      target_warehouse_id: d.warehouseId,
      target_supplier_id: d.supplierId,
      target_purchase_date: d.purchaseDate,
      actor_id: u,
      target_items: d.items,
      target_discount: d.discount ?? 0,
      target_tax: d.tax ?? 0,
      target_notes: d.notes ?? null,
    });
  }
  receive(c: string, u: string, id: string, d: ReceiveInput) {
    return this.db.client.rpc('receive_purchase', {
      target_company_id: c,
      target_purchase_id: id,
      actor_id: u,
      target_idempotency_key: d.idempotencyKey,
      target_items: d.items,
      target_notes: d.notes ?? null,
    });
  }
  cancel(c: string, u: string, id: string, reason: string) {
    return this.db.client.rpc('cancel_purchase', {
      target_company_id: c,
      target_purchase_id: id,
      actor_id: u,
      target_reason: reason,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import type { AdjustmentInput, InventoryQuery, MovementQuery, TransferInput } from './dto/inventory.dto.js';
@Injectable()
export class InventoryRepository {
  constructor(private readonly db: SupabaseService) {}
  list(c: string, q: InventoryQuery, allowedBranches?: string[]) {
    const limit = Math.min(Math.max(Number(q.limit) || 50, 1), 100);
    const offset = Math.max(Number(q.offset) || 0, 0);
    let query = this.db.client
      .from('inventory')
      .select(
        '*,product:products!inner(id,name,sku,category_id),warehouse:warehouses(id,name,code),branch:branches(id,name)',
      )
      .eq('company_id', c)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (q.branchId) query = query.eq('branch_id', q.branchId);
    else if (allowedBranches) query = query.in('branch_id', allowedBranches);
    if (q.categoryId) query = query.eq('products.category_id', q.categoryId);
    if (q.search) {
      const search = q.search.replace(/[%_,]/g, '');
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`, { referencedTable: 'products' });
    }
    return query;
  }
  movements(c: string, q: MovementQuery, allowedBranches?: string[]) {
    const limit = Math.min(Math.max(Number(q.limit) || 50, 1), 100);
    const offset = Math.max(Number(q.offset) || 0, 0);
    let query = this.db.client
      .from('inventory_movements')
      .select('*,product:products(id,name,sku),warehouse:warehouses(id,name),branch:branches(id,name),actor:profiles(id,full_name)')
      .eq('company_id', c)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (q.branchId) query = query.eq('branch_id', q.branchId);
    else if (allowedBranches) query = query.in('branch_id', allowedBranches);
    if (q.productId) query = query.eq('product_id', q.productId);
    if (q.movementType) query = query.eq('movement_type', q.movementType);
    if (q.from) query = query.gte('created_at', q.from);
    if (q.to) query = query.lte('created_at', `${q.to}T23:59:59.999Z`);
    return query;
  }
  adjust(c: string, u: string, d: AdjustmentInput) {
    return this.db.client.rpc('adjust_inventory', {
      target_company_id: c,
      target_branch_id: d.branchId,
      target_warehouse_id: d.warehouseId,
      target_product_id: d.productId,
      quantity_delta: d.quantityDelta,
      target_minimum_stock: d.minimumStock ?? null,
      movement_kind: d.reason === 'DAMAGED' ? 'DAMAGED' : 'ADJUSTMENT',
      actor_id: u,
      movement_notes: `${d.reason}${d.notes?.trim() ? `: ${d.notes.trim()}` : ''}`,
      target_reference_type: d.referenceType ?? null,
      target_reference_id: d.referenceId ?? null,
    });
  }
  transfer(c: string, u: string, d: TransferInput) {
    return this.db.client.rpc('transfer_inventory', {
      target_company_id: c,
      source_warehouse_id: d.sourceWarehouseId,
      destination_warehouse_id: d.destinationWarehouseId,
      target_product_id: d.productId,
      transfer_quantity: d.quantity,
      actor_id: u,
      transfer_notes: d.notes ?? null,
    });
  }
  transferScopes(c: string, d: TransferInput) {
    return this.db.client.from('warehouses').select('id,branch_id').eq('company_id', c).in('id', [d.sourceWarehouseId, d.destinationWarehouseId]);
  }
}

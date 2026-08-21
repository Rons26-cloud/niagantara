import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import type { AdjustmentInput, TransferInput } from './dto/inventory.dto.js';
@Injectable()
export class InventoryRepository {
  constructor(private readonly db: SupabaseService) {}
  list(c: string, b?: string, low = false, allowedBranches?: string[]) {
    let q = this.db.client
      .from('inventory')
      .select(
        '*,product:products(id,name,sku),warehouse:warehouses(id,name,code),branch:branches(id,name)',
      )
      .eq('company_id', c)
      .order('updated_at', { ascending: false });
    if (b) q = q.eq('branch_id', b);
    else if (allowedBranches) q = q.in('branch_id', allowedBranches);
    if (low) q = q.filter('quantity', 'lte', 'minimum_stock');
    return q;
  }
  movements(c: string, b?: string, allowedBranches?: string[]) {
    let q = this.db.client
      .from('inventory_movements')
      .select('*,product:products(id,name,sku),warehouse:warehouses(id,name)')
      .eq('company_id', c)
      .order('created_at', { ascending: false })
      .limit(50);
    if (b) q = q.eq('branch_id', b);
    else if (allowedBranches) q = q.in('branch_id', allowedBranches);
    return q;
  }
  adjust(c: string, u: string, d: AdjustmentInput) {
    return this.db.client.rpc('adjust_inventory', {
      target_company_id: c,
      target_branch_id: d.branchId,
      target_warehouse_id: d.warehouseId,
      target_product_id: d.productId,
      quantity_delta: d.quantityDelta,
      target_minimum_stock: d.minimumStock ?? null,
      movement_kind: d.movementType,
      actor_id: u,
      movement_notes: d.notes ?? null,
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

import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import type { CheckoutInput } from './dto/pos.dto.js';
@Injectable()
export class PosRepository {
  constructor(private readonly db: SupabaseService) {}
  async lookup(
    companyId: string,
    branchId: string,
    warehouseId: string,
    search: string,
    categoryId?: string,
  ) {
    let products = this.db.client
      .from('products')
      .select('id,name,sku,selling_price,category_id,barcodes(code,is_primary)')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .limit(50);
    if (categoryId) products = products.eq('category_id', categoryId);
    if (search)
      products = products.or(
        `name.ilike.%${search.replace(/[%_,]/g, '')}%,sku.ilike.%${search.replace(/[%_,]/g, '')}%`,
      );
    const { data, error } = await products;
    if (error) return { data: null, error };
    const ids = (data ?? []).map((row: any) => row.id);
    if (!ids.length) return { data: [], error: null };
    const { data: stock, error: stockError } = await this.db.client
      .from('inventory')
      .select('product_id,quantity,minimum_stock')
      .eq('company_id', companyId)
      .eq('branch_id', branchId)
      .eq('warehouse_id', warehouseId)
      .in('product_id', ids);
    if (stockError) return { data: null, error: stockError };
    const quantities = new Map(
      (stock ?? []).map((row: any) => [row.product_id, row]),
    );
    return {
      data: (data ?? []).map((product: any) => ({
        ...product,
        inventory: quantities.get(product.id) ?? {
          quantity: 0,
          minimum_stock: 0,
        },
      })),
      error: null,
    };
  }
  async barcode(
    companyId: string,
    branchId: string,
    warehouseId: string,
    code: string,
  ) {
    const { data, error } = await this.db.client
      .from('barcodes')
      .select(
        'code,product:products(id,name,sku,selling_price,category_id,status)',
      )
      .eq('company_id', companyId)
      .eq('code', code)
      .eq('active', true)
      .maybeSingle();
    if (error || !data) return { data: null, error };
    const product = Array.isArray(data.product)
      ? data.product[0]
      : data.product;
    if (!product || product.status !== 'active')
      return { data: null, error: null };
    const { data: inventory, error: inventoryError } = await this.db.client
      .from('inventory')
      .select('quantity,minimum_stock')
      .eq('company_id', companyId)
      .eq('branch_id', branchId)
      .eq('warehouse_id', warehouseId)
      .eq('product_id', product.id)
      .maybeSingle();
    return {
      data: inventory ? { ...product, barcode: data.code, inventory } : null,
      error: inventoryError,
    };
  }
  checkout(companyId: string, actorId: string, dto: CheckoutInput) {
    return this.db.client.rpc('checkout_sale', {
      target_company_id: companyId,
      target_store_id: dto.storeId,
      target_branch_id: dto.branchId,
      target_warehouse_id: dto.warehouseId,
      target_shift_id: dto.shiftId,
      actor_id: actorId,
      target_idempotency_key: dto.idempotencyKey,
      cart: dto.items,
      transaction_discount_type: dto.transactionDiscountType ?? null,
      transaction_discount_value: dto.transactionDiscountValue ?? 0,
      target_tax_rate: dto.taxRate ?? 0,
      payment_method: dto.paymentMethod,
      amount_received: dto.amountReceived ?? null,
      payment_reference: dto.paymentReference ?? null,
    });
  }
}

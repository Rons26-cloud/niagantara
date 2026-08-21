import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import type { ProductInput, ProductQuery } from './dto/product.dto.js';
@Injectable()
export class ProductsRepository {
  constructor(private readonly db: SupabaseService) {}
  async list(companyId: string, q: ProductQuery) {
    let query = this.db.client
      .from('products')
      .select('*,category:categories(id,name),barcodes(code,source,is_primary)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(Math.min(q.limit ?? 50, 100));
    if (q.status) query = query.eq('status', q.status);
    if (q.categoryId) query = query.eq('category_id', q.categoryId);
    if (q.cursor) query = query.lt('created_at', q.cursor);
    if (q.search) {
      const escaped = q.search.replace(/[%_,]/g, '');
      query = query.or(`name.ilike.%${escaped}%,sku.ilike.%${escaped}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    if (q.search) {
      const { data: codes, error: codeError } = await this.db.client
        .from('barcodes')
        .select('product_id')
        .eq('company_id', companyId)
        .ilike('code', `%${q.search.replace(/[%_]/g, '')}%`);
      if (codeError) throw codeError;
      const ids = new Set((codes ?? []).map((x) => x.product_id));
      return (data ?? []).filter(
        (x) =>
          ids.has(x.id) ||
          x.name.toLowerCase().includes(q.search!.toLowerCase()) ||
          x.sku.toLowerCase().includes(q.search!.toLowerCase()),
      );
    }
    return data ?? [];
  }
  async get(companyId: string, id: string) {
    return this.db.client
      .from('products')
      .select('*,category:categories(id,name),barcodes(*)')
      .eq('company_id', companyId)
      .eq('id', id)
      .maybeSingle();
  }
  async create(companyId: string, userId: string, dto: ProductInput) {
    return this.db.client
      .from('products')
      .insert({
        company_id: companyId,
        created_by: userId,
        name: dto.name,
        sku: dto.sku,
        category_id: dto.categoryId ?? null,
        description: dto.description ?? null,
        cost_price: dto.costPrice ?? 0,
        selling_price: dto.sellingPrice ?? 0,
        status: dto.status ?? 'active',
      })
      .select()
      .single();
  }
  async update(companyId: string, id: string, dto: ProductInput) {
    return this.db.client
      .from('products')
      .update({
        name: dto.name,
        sku: dto.sku,
        category_id: dto.categoryId ?? null,
        description: dto.description ?? null,
        cost_price: dto.costPrice ?? 0,
        selling_price: dto.sellingPrice ?? 0,
        status: dto.status,
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', companyId)
      .eq('id', id)
      .select()
      .single();
  }
}

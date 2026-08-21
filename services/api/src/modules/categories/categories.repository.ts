import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
import type { CategoryInput } from './dto/category.dto.js';
@Injectable()
export class CategoriesRepository {
  constructor(private readonly db: SupabaseService) {}
  list(c: string) {
    return this.db.client
      .from('categories')
      .select('*')
      .eq('company_id', c)
      .order('name');
  }
  create(c: string, u: string, d: CategoryInput) {
    return this.db.client
      .from('categories')
      .insert({
        company_id: c,
        created_by: u,
        name: d.name,
        description: d.description ?? null,
      })
      .select()
      .single();
  }
  update(c: string, id: string, d: CategoryInput) {
    return this.db.client
      .from('categories')
      .update({ ...d, updated_at: new Date().toISOString() })
      .eq('company_id', c)
      .eq('id', id)
      .select()
      .single();
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { ProductsRepository } from './products.repository.js';
import type { ProductInput, ProductQuery } from './dto/product.dto.js';
@Injectable()
export class ProductsService {
  constructor(
    private readonly repo: ProductsRepository,
    private readonly audit: AuditService,
  ) {}
  list(c: string, q: ProductQuery) {
    return this.repo.list(c, q);
  }
  async get(c: string, id: string) {
    const { data, error } = await this.repo.get(c, id);
    if (error) throw error;
    if (!data)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Product not found.',
      });
    return data;
  }
  async create(u: string, c: string, d: ProductInput) {
    const { data, error } = await this.repo.create(c, u, d);
    if (error) throw error;
    await this.audit.record({
      action: 'product.create',
      resourceType: 'product',
      resourceId: data.id,
      actorUserId: u,
      companyId: c,
    });
    return data;
  }
  async update(u: string, c: string, id: string, d: ProductInput) {
    await this.get(c, id);
    const { data, error } = await this.repo.update(c, id, d);
    if (error) throw error;
    await this.audit.record({
      action: 'product.update',
      resourceType: 'product',
      resourceId: id,
      actorUserId: u,
      companyId: c,
    });
    return data;
  }
  async archive(u: string, c: string, id: string) {
    const existing = await this.get(c, id);
    return this.update(u, c, id, {
      ...existing,
      status: 'archived',
      categoryId: existing.category_id,
      costPrice: existing.cost_price,
      sellingPrice: existing.selling_price,
    });
  }
}

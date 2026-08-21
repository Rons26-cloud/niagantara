import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { CategoriesRepository } from './categories.repository.js';
import type { CategoryInput } from './dto/category.dto.js';
@Injectable()
export class CategoriesService {
  constructor(
    private readonly repo: CategoriesRepository,
    private readonly audit: AuditService,
  ) {}
  async list(c: string) {
    const { data, error } = await this.repo.list(c);
    if (error) throw error;
    return data ?? [];
  }
  async create(u: string, c: string, d: CategoryInput) {
    const { data, error } = await this.repo.create(c, u, d);
    if (error) throw error;
    await this.audit.record({
      action: 'category.create',
      resourceType: 'category',
      resourceId: data.id,
      actorUserId: u,
      companyId: c,
    });
    return data;
  }
  async update(u: string, c: string, id: string, d: CategoryInput) {
    const { data, error } = await this.repo.update(c, id, d);
    if (error) throw error;
    if (!data)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Category not found.',
      });
    await this.audit.record({
      action: 'category.update',
      resourceType: 'category',
      resourceId: id,
      actorUserId: u,
      companyId: c,
    });
    return data;
  }
  archive(u: string, c: string, id: string) {
    return this.update(u, c, id, { name: 'Archived', status: 'archived' });
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { WarehousesRepository } from './warehouses.repository.js';
import type { WarehouseInput } from './dto/warehouse.dto.js';
@Injectable()
export class WarehousesService {
  constructor(
    private readonly repo: WarehousesRepository,
    private readonly audit: AuditService,
  ) {}
  async list(c: string, b?: string) {
    const { data, error } = await this.repo.list(c, b);
    if (error) throw error;
    return data ?? [];
  }
  async validate(c: string, d: WarehouseInput) {
    const [store, branch] = await this.repo.relations(c, d);
    if (
      store.error ||
      branch.error ||
      !store.data ||
      !branch.data ||
      branch.data.store_id !== d.storeId
    )
      throw new BadRequestException({
        code: 'TENANT_RELATION_INVALID',
        message:
          'Warehouse store and branch must belong to the active company.',
      });
  }
  async create(u: string, c: string, d: WarehouseInput) {
    await this.validate(c, d);
    const { data, error } = await this.repo.create(c, u, d);
    if (error) throw error;
    await this.audit.record({
      action: 'warehouse.create',
      resourceType: 'warehouse',
      resourceId: data.id,
      actorUserId: u,
      companyId: c,
      branchId: d.branchId,
    });
    return data;
  }
  async update(u: string, c: string, id: string, d: Partial<WarehouseInput>) {
    const { data, error } = await this.repo.update(c, id, d);
    if (error) throw error;
    if (!data)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Warehouse not found.',
      });
    await this.audit.record({
      action: 'warehouse.update',
      resourceType: 'warehouse',
      resourceId: id,
      actorUserId: u,
      companyId: c,
      branchId: data.branch_id,
    });
    return data;
  }
}

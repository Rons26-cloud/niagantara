import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { InventoryRepository } from './inventory.repository.js';
import type { AdjustmentInput, TransferInput } from './dto/inventory.dto.js';
@Injectable()
export class InventoryService {
  constructor(
    private readonly repo: InventoryRepository,
    private readonly audit: AuditService,
  ) {}
  async list(c: string, b?: string, low = false, allowedBranches?: string[]) {
    if (b && allowedBranches && !allowedBranches.includes(b)) throw new BadRequestException({ code: 'BRANCH_ACCESS_DENIED', message: 'Branch is outside your scope.' });
    const { data, error } = await this.repo.list(c, b, low, allowedBranches);
    if (error) throw error;
    const rows = data ?? [];
    return low
      ? rows.filter((x: any) => Number(x.quantity) <= Number(x.minimum_stock))
      : rows;
  }
  async movements(c: string, b?: string, allowedBranches?: string[]) {
    if (b && allowedBranches && !allowedBranches.includes(b)) throw new BadRequestException({ code: 'BRANCH_ACCESS_DENIED', message: 'Branch is outside your scope.' });
    const { data, error } = await this.repo.movements(c, b, allowedBranches);
    if (error) throw error;
    return data ?? [];
  }
  async adjust(u: string, c: string, d: AdjustmentInput) {
    if (!Number.isFinite(d.quantityDelta) || d.quantityDelta === 0)
      throw new BadRequestException({
        code: 'INVALID_QUANTITY',
        message: 'Quantity delta must be non-zero.',
      });
    const { data, error } = await this.repo.adjust(c, u, d);
    if (error) throw error;
    await this.audit.record({
      action: 'inventory.adjust',
      resourceType: 'inventory',
      resourceId: (data as any).id,
      actorUserId: u,
      companyId: c,
      branchId: d.branchId,
      metadata: { movementType: d.movementType },
    });
    return data;
  }
  async transfer(u: string, c: string, d: TransferInput, allowedBranches?: string[]) {
    if (!Number.isFinite(d.quantity) || d.quantity <= 0)
      throw new BadRequestException({
        code: 'INVALID_QUANTITY',
        message: 'Transfer quantity must be positive.',
      });
    const { data: scopes, error: scopeError } = await this.repo.transferScopes(c, d);
    if (scopeError || (scopes ?? []).length !== 2) throw new BadRequestException({ code: 'WAREHOUSE_RELATION_INVALID', message: 'Transfer warehouses must belong to the active company.' });
    if (allowedBranches && (scopes ?? []).some((warehouse: { branch_id: string }) => !allowedBranches.includes(warehouse.branch_id))) {
      throw new BadRequestException({ code: 'BRANCH_ACCESS_DENIED', message: 'Both transfer branches must be inside your scope.' });
    }
    const { data, error } = await this.repo.transfer(c, u, d);
    if (error) throw error;
    await this.audit.record({
      action: 'inventory.transfer',
      resourceType: 'stock_transfer',
      resourceId: data as string,
      actorUserId: u,
      companyId: c,
    });
    return { transferId: data };
  }
}

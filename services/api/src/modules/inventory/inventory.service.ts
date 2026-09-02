import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { InventoryRepository } from './inventory.repository.js';
import type {
  AdjustmentInput,
  InventoryQuery,
  MovementQuery,
  TransferInput,
} from './dto/inventory.dto.js';
@Injectable()
export class InventoryService {
  constructor(
    private readonly repo: InventoryRepository,
    private readonly audit: AuditService,
  ) {}
  async list(c: string, q: InventoryQuery = {}, allowedBranches?: string[]) {
    if (q.branchId && allowedBranches && !allowedBranches.includes(q.branchId))
      throw new ForbiddenException({
        code: 'BRANCH_ACCESS_DENIED',
        message: 'Branch is outside your scope.',
      });
    if (allowedBranches?.length === 0) return [];
    const { data, error } = await this.repo.list(c, q, allowedBranches);
    if (error) throw error;
    const rows = data ?? [];
    return rows.filter((x: any) => {
      const quantity = Number(x.quantity);
      const minimum = Number(x.minimum_stock);
      if (q.status === 'OUT_OF_STOCK') return quantity <= 0;
      if (q.status === 'LOW_STOCK') return quantity > 0 && quantity <= minimum;
      if (q.status === 'IN_STOCK') return quantity > minimum;
      return true;
    });
  }
  async movements(
    c: string,
    q: MovementQuery = {},
    allowedBranches?: string[],
  ) {
    if (q.branchId && allowedBranches && !allowedBranches.includes(q.branchId))
      throw new ForbiddenException({
        code: 'BRANCH_ACCESS_DENIED',
        message: 'Branch is outside your scope.',
      });
    if (allowedBranches?.length === 0) return [];
    const { data, error } = await this.repo.movements(c, q, allowedBranches);
    if (error) throw error;
    return data ?? [];
  }
  async adjust(
    u: string,
    c: string,
    authorizedBranchId: string,
    d: AdjustmentInput,
  ) {
    if (d.branchId !== authorizedBranchId)
      throw new ForbiddenException({
        code: 'BRANCH_ACCESS_DENIED',
        message: 'Adjustment branch differs from authorized branch.',
      });
    if (!Number.isFinite(d.quantityDelta) || d.quantityDelta === 0)
      throw new BadRequestException({
        code: 'INVALID_QUANTITY',
        message: 'Quantity delta must be non-zero.',
      });
    if (
      d.minimumStock !== undefined &&
      (!Number.isFinite(d.minimumStock) || d.minimumStock < 0)
    )
      throw new BadRequestException({
        code: 'INVALID_MINIMUM_STOCK',
        message: 'Minimum stock must be finite and non-negative.',
      });
    const reasons = [
      'CORRECTION',
      'DAMAGED',
      'EXPIRED',
      'LOST',
      'MANUAL_CORRECTION',
      'OTHER',
    ];
    if (!reasons.includes(d.reason))
      throw new BadRequestException({
        code: 'INVALID_ADJUSTMENT_REASON',
        message: 'A valid adjustment reason is required.',
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
      metadata: {
        reason: d.reason,
        quantityDelta: d.quantityDelta,
        previousQuantity: Number((data as any).quantity) - d.quantityDelta,
        resultingQuantity: Number((data as any).quantity),
        warehouseId: d.warehouseId,
        productId: d.productId,
      },
    });
    return data;
  }
  async transfer(
    u: string,
    c: string,
    d: TransferInput,
    allowedBranches?: string[],
  ) {
    if (!Number.isFinite(d.quantity) || d.quantity <= 0)
      throw new BadRequestException({
        code: 'INVALID_QUANTITY',
        message: 'Transfer quantity must be positive.',
      });
    const { data: scopes, error: scopeError } = await this.repo.transferScopes(
      c,
      d,
    );
    if (scopeError || (scopes ?? []).length !== 2)
      throw new BadRequestException({
        code: 'WAREHOUSE_RELATION_INVALID',
        message: 'Transfer warehouses must belong to the active company.',
      });
    if (
      allowedBranches &&
      (scopes ?? []).some(
        (warehouse: { branch_id: string }) =>
          !allowedBranches.includes(warehouse.branch_id),
      )
    ) {
      throw new BadRequestException({
        code: 'BRANCH_ACCESS_DENIED',
        message: 'Both transfer branches must be inside your scope.',
      });
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

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PurchasesRepository } from './purchases.repository.js';
import type {
  PurchaseInput,
  PurchaseQuery,
  ReceiveInput,
} from './dto/purchase.dto.js';
@Injectable()
export class PurchasesService {
  constructor(private readonly repo: PurchasesRepository) {}
  async list(c: string, q: PurchaseQuery, allowedBranches?: string[]) {
    if (q.branchId && allowedBranches && !allowedBranches.includes(q.branchId))
      throw new ForbiddenException({ code: 'BRANCH_ACCESS_DENIED', message: 'Purchase branch is outside your scope.' });
    if (allowedBranches?.length === 0) return [];
    const { data, error } = await this.repo.list(c, q, allowedBranches);
    if (error) throw error;
    return data ?? [];
  }
  async get(c: string, id: string, branchId?: string, allowedBranches?: string[]) {
    if (branchId && allowedBranches && !allowedBranches.includes(branchId))
      throw new ForbiddenException({ code: 'BRANCH_ACCESS_DENIED', message: 'Purchase branch is outside your scope.' });
    if (allowedBranches?.length === 0)
      throw new NotFoundException({ code: 'PURCHASE_NOT_FOUND', message: 'Purchase not found.' });
    const { data, error } = await this.repo.get(c, id, branchId, allowedBranches);
    if (error) throw error;
    if (!data)
      throw new NotFoundException({
        code: 'PURCHASE_NOT_FOUND',
        message: 'Purchase not found.',
      });
    return data;
  }
  async create(u: string, c: string, b: string, d: PurchaseInput) {
    if (d.branchId !== b)
      throw new ForbiddenException({
        code: 'BRANCH_ACCESS_DENIED',
        message: 'Purchase branch differs from authorized branch.',
      });
    if (
      !d.items?.length ||
      d.items.some(
        (x) =>
          !Number.isFinite(x.quantity) ||
          x.quantity <= 0 ||
          !Number.isFinite(x.unitCost) ||
          x.unitCost < 0,
      )
    )
      throw new BadRequestException({
        code: 'INVALID_PURCHASE_ITEMS',
        message: 'Positive quantity and non-negative cost are required.',
      });
    if (!d.purchaseDate || Number.isNaN(Date.parse(`${d.purchaseDate}T00:00:00Z`)))
      throw new BadRequestException({ code: 'INVALID_PURCHASE_DATE', message: 'A valid purchase date is required.' });
    if ((d.discount !== undefined && (!Number.isFinite(d.discount) || d.discount < 0)) ||
        (d.tax !== undefined && (!Number.isFinite(d.tax) || d.tax < 0)))
      throw new BadRequestException({ code: 'INVALID_PURCHASE_TOTALS', message: 'Discount and tax must be finite and non-negative.' });
    if (new Set(d.items.map((item) => item.productId)).size !== d.items.length)
      throw new BadRequestException({ code: 'DUPLICATE_PURCHASE_ITEM', message: 'Each product may appear only once.' });
    const { data, error } = await this.repo.create(c, u, d);
    if (error) throw error;
    return { id: data };
  }
  async receive(
    u: string,
    c: string,
    branchId: string | undefined,
    id: string,
    d: ReceiveInput,
    allowedBranches?: string[],
  ) {
    if (
      !d.idempotencyKey ||
      !d.items?.length ||
      d.items.some((x) => !Number.isFinite(x.quantity) || x.quantity <= 0)
    )
      throw new BadRequestException({
        code: 'INVALID_RECEIPT',
        message:
          'Idempotency key and positive receipt quantities are required.',
      });
    if (new Set(d.items.map((item) => item.purchaseItemId)).size !== d.items.length)
      throw new BadRequestException({ code: 'DUPLICATE_RECEIPT_ITEM', message: 'Each purchase item may appear only once per receipt.' });
    await this.get(c, id, branchId, allowedBranches);
    const { data, error } = await this.repo.receive(c, u, id, d);
    if (error) throw error;
    return { receiptId: data };
  }
  async cancel(
    u: string,
    c: string,
    branchId: string | undefined,
    id: string,
    reason: string,
    allowedBranches?: string[],
  ) {
    if (reason?.trim().length < 3)
      throw new BadRequestException({
        code: 'CANCELLATION_REASON_REQUIRED',
        message: 'Cancellation reason is required.',
      });
    await this.get(c, id, branchId, allowedBranches);
    const { data, error } = await this.repo.cancel(c, u, id, reason);
    if (error) throw error;
    return data;
  }
}

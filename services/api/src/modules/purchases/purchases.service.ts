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
  async list(c: string, q: PurchaseQuery) {
    const { data, error } = await this.repo.list(c, q);
    if (error) throw error;
    return data ?? [];
  }
  async get(c: string, id: string, branchId?: string) {
    const { data, error } = await this.repo.get(c, id, branchId);
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
  ) {
    if (
      !d.idempotencyKey ||
      !d.items?.length ||
      d.items.some((x) => x.quantity <= 0)
    )
      throw new BadRequestException({
        code: 'INVALID_RECEIPT',
        message:
          'Idempotency key and positive receipt quantities are required.',
      });
    await this.get(c, id, branchId);
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
  ) {
    if (reason?.trim().length < 3)
      throw new BadRequestException({
        code: 'CANCELLATION_REASON_REQUIRED',
        message: 'Cancellation reason is required.',
      });
    await this.get(c, id, branchId);
    const { data, error } = await this.repo.cancel(c, u, id, reason);
    if (error) throw error;
    return data;
  }
}

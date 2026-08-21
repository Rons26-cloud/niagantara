import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SalesRepository } from './sales.repository.js';
import type { RefundSaleInput, SaleQuery } from './dto/sale.dto.js';
@Injectable()
export class SalesService {
  constructor(private readonly repo: SalesRepository) {}
  async list(c: string, q: SaleQuery, branches?: string[]) {
    if (q.branchId && branches && !branches.includes(q.branchId))
      throw new BadRequestException({
        code: 'BRANCH_ACCESS_DENIED',
        message: 'Branch is outside your scope.',
      });
    const { data, error } = await this.repo.list(c, q, branches);
    if (error) throw error;
    return q.paymentMethod
      ? (data ?? []).filter((s: any) => {
          const p = Array.isArray(s.payment) ? s.payment[0] : s.payment;
          return p?.method === q.paymentMethod;
        })
      : (data ?? []);
  }
  async detail(c: string, id: string, branches?: string[]) {
    const { data, error } = await this.repo.detail(c, id);
    if (error) throw error;
    if (!data || (branches && !branches.includes(data.branch_id)))
      throw new NotFoundException({
        code: 'SALE_NOT_FOUND',
        message: 'Sale not found.',
      });
    return data;
  }
  async cancel(
    c: string,
    u: string,
    id: string,
    reason: string,
    branches?: string[],
  ) {
    if (reason?.trim().length < 3)
      throw new BadRequestException({
        code: 'CANCELLATION_REASON_REQUIRED',
        message: 'Cancellation reason is required.',
      });
    await this.detail(c, id, branches);
    const { data, error } = await this.repo.cancel(c, u, id, reason);
    if (error) throw error;
    return data;
  }
  async refund(
    c: string,
    u: string,
    id: string,
    d: RefundSaleInput,
    branches?: string[],
  ) {
    if (d.reason?.trim().length < 3 || !d.items?.length)
      throw new BadRequestException({
        code: 'INVALID_REFUND',
        message: 'Refund reason and items are required.',
      });
    await this.detail(c, id, branches);
    const { data, error } = await this.repo.refund(c, u, id, d);
    if (error) throw error;
    return { refundId: data };
  }
}

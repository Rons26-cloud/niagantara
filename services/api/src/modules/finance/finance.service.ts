import { BadRequestException, Injectable } from '@nestjs/common';
import { FinanceRepository } from './finance.repository.js';
import type { FinanceQuery, PaymentInput } from './dto/finance.dto.js';
@Injectable()
export class FinanceService {
  constructor(private readonly repo: FinanceRepository) {}
  async payables(c: string) {
    const { data, error } = await this.repo.payables(c);
    if (error) throw error;
    return data ?? [];
  }
  async receivables(c: string) {
    const { data, error } = await this.repo.receivables(c);
    if (error) throw error;
    return data ?? [];
  }
  private validate(d: PaymentInput) {
    if (!Number.isFinite(d.amount) || d.amount <= 0 || !d.idempotencyKey)
      throw new BadRequestException({
        code: 'INVALID_PAYMENT',
        message: 'Positive amount and idempotency key are required.',
      });
  }
  async payable(c: string, u: string, id: string, d: PaymentInput) {
    this.validate(d);
    const { data, error } = await this.repo.payPayable(c, u, id, d);
    if (error) throw error;
    return data;
  }
  async receivable(c: string, u: string, id: string, d: PaymentInput) {
    this.validate(d);
    const { data, error } = await this.repo.payReceivable(c, u, id, d);
    if (error) throw error;
    return data;
  }
  async report(c: string, f: FinanceQuery) {
    const { data, error } = await this.repo.report(c, f);
    if (error) throw error;
    const rows = data ?? [];
    const total = (type: string, dir: string) =>
      rows
        .filter((x) => x.event_type === type && x.direction === dir)
        .reduce((n, x) => n + Number(x.amount), 0);
    const revenue =
        total('SALE_INCOME', 'IN') + total('RECEIVABLE_PAYMENT', 'IN'),
      expenses = total('EXPENSE', 'OUT'),
      purchases = total('PAYABLE_PAYMENT', 'OUT'),
      refunds = total('REFUND', 'OUT');
    return {
      label: 'Basic operating cash summary (not audited accounting profit)',
      revenue,
      cashReceived: revenue,
      expenses,
      purchases,
      refunds,
      operatingCashResult: revenue - expenses - purchases - refunds,
      transactions: rows,
    };
  }
}

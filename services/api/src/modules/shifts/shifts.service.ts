import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShiftsRepository } from './shifts.repository.js';
import type { OpenShiftInput } from './dto/shift.dto.js';
@Injectable()
export class ShiftsService {
  constructor(private readonly repo: ShiftsRepository) {}
  async list(c: string, b?: string, u?: string, allowedBranches?: string[]) {
    if (b && allowedBranches && !allowedBranches.includes(b))
      throw new ForbiddenException({
        code: 'BRANCH_ACCESS_DENIED',
        message: 'Shift branch is outside your scope.',
      });
    if (allowedBranches?.length === 0) return [];
    const { data, error } = await this.repo.list(c, b, u, allowedBranches);
    if (error) throw error;
    return data ?? [];
  }
  async open(c: string, u: string, d: OpenShiftInput) {
    if (!Number.isFinite(d.openingCash) || d.openingCash < 0)
      throw new BadRequestException({
        code: 'INVALID_OPENING_CASH',
        message: 'Opening cash must be non-negative.',
      });
    const { data, error } = await this.repo.open(c, u, d);
    if (error) throw error;
    return data;
  }
  async close(
    c: string,
    u: string,
    branchId: string | undefined,
    id: string,
    amount: number,
  ) {
    if (!Number.isFinite(amount) || amount < 0)
      throw new BadRequestException({
        code: 'INVALID_CLOSING_CASH',
        message: 'Closing cash must be non-negative.',
      });
    const { data: shift, error: findError } = await this.repo.get(
      c,
      id,
      branchId,
    );
    if (findError) throw findError;
    if (!shift)
      throw new NotFoundException({
        code: 'SHIFT_NOT_FOUND',
        message: 'Shift not found.',
      });
    const { data, error } = await this.repo.close(c, u, id, amount);
    if (error) throw error;
    return data;
  }
}

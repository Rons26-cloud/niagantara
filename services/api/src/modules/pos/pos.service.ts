import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PosRepository } from './pos.repository.js';
import type { CheckoutInput } from './dto/pos.dto.js';
@Injectable()
export class PosService {
  constructor(private readonly repo: PosRepository) {}
  async lookup(
    companyId: string,
    branchId: string,
    warehouseId: string,
    search = '',
    categoryId?: string,
  ) {
    const { data, error } = await this.repo.lookup(
      companyId,
      branchId,
      warehouseId,
      search,
      categoryId,
    );
    if (error) throw error;
    return data ?? [];
  }
  async barcode(
    companyId: string,
    branchId: string,
    warehouseId: string,
    code: string,
  ) {
    const { data, error } = await this.repo.barcode(
      companyId,
      branchId,
      warehouseId,
      code.trim(),
    );
    if (error) throw error;
    if (!data)
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product is unavailable for this branch inventory.',
      });
    return data;
  }
  async checkout(
    actorId: string,
    companyId: string,
    authorizedBranchId: string,
    dto: CheckoutInput,
    permissions: string[],
  ) {
    if (dto.branchId !== authorizedBranchId)
      throw new ForbiddenException({
        code: 'BRANCH_ACCESS_DENIED',
        message: 'Checkout branch does not match authorized context.',
      });
    if (
      !dto.items?.length ||
      dto.items.some(
        (item) => !Number.isFinite(item.quantity) || item.quantity <= 0,
      )
    )
      throw new BadRequestException({
        code: 'INVALID_CART',
        message: 'Cart requires positive quantities.',
      });
    const discounted =
      Boolean(dto.transactionDiscountType) ||
      dto.items.some((item) => Boolean(item.discountType));
    if (discounted && !permissions.includes('pos.discount'))
      throw new ForbiddenException({
        code: 'DISCOUNT_ACCESS_DENIED',
        message: 'Discount permission is required.',
      });
    const { data, error } = await this.repo.checkout(companyId, actorId, dto);
    if (error) throw error;
    return { saleId: data, idempotencyKey: dto.idempotencyKey };
  }
}

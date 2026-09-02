import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { SuppliersRepository } from './suppliers.repository.js';
import type { SupplierInput, SupplierQuery } from './dto/supplier.dto.js';
@Injectable()
export class SuppliersService {
  constructor(
    private readonly repo: SuppliersRepository,
    private readonly audit: AuditService,
  ) {}
  async list(c: string, q: SupplierQuery) {
    const { data, error } = await this.repo.list(c, q);
    if (error) throw error;
    return data ?? [];
  }
  async get(c: string, id: string) {
    const { data, error } = await this.repo.get(c, id);
    if (error) throw error;
    if (!data)
      throw new NotFoundException({
        code: 'SUPPLIER_NOT_FOUND',
        message: 'Supplier not found.',
      });
    return data;
  }
  private validate(d: Partial<SupplierInput>, partial = false) {
    if ((!partial || d.name !== undefined) && !d.name?.trim())
      throw new BadRequestException({
        code: 'INVALID_SUPPLIER_NAME',
        message: 'Supplier name is required.',
      });
    if ((!partial || d.supplierCode !== undefined) && !d.supplierCode?.trim())
      throw new BadRequestException({
        code: 'INVALID_SUPPLIER_CODE',
        message: 'Supplier code is required.',
      });
    if (d.status !== undefined && !['active', 'inactive'].includes(d.status))
      throw new BadRequestException({
        code: 'INVALID_SUPPLIER_STATUS',
        message: 'Supplier status is invalid.',
      });
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))
      throw new BadRequestException({
        code: 'INVALID_SUPPLIER_EMAIL',
        message: 'Supplier email is invalid.',
      });
  }
  async create(u: string, c: string, d: SupplierInput) {
    this.validate(d);
    const { data, error } = await this.repo.create(c, u, d);
    if (error) throw error;
    await this.audit.record({
      action: 'supplier.created',
      resourceType: 'supplier',
      resourceId: data.id,
      actorUserId: u,
      companyId: c,
    });
    return data;
  }
  async update(u: string, c: string, id: string, d: Partial<SupplierInput>) {
    this.validate(d, true);
    await this.get(c, id);
    const { data, error } = await this.repo.update(c, id, d);
    if (error) throw error;
    await this.audit.record({
      action: 'supplier.updated',
      resourceType: 'supplier',
      resourceId: id,
      actorUserId: u,
      companyId: c,
    });
    return data;
  }
}

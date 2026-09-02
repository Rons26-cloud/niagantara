import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { CustomersRepository } from './customers.repository.js';
import type { CustomerInput, CustomerQuery } from './dto/customer.dto.js';
@Injectable()
export class CustomersService {
  constructor(
    private readonly repo: CustomersRepository,
    private readonly audit: AuditService,
  ) {}
  async list(c: string, q: CustomerQuery) {
    const { data, error } = await this.repo.list(c, q);
    if (error) throw error;
    return data ?? [];
  }
  async get(c: string, id: string) {
    const { data, error } = await this.repo.get(c, id);
    if (error) throw error;
    if (!data)
      throw new NotFoundException({
        code: 'CUSTOMER_NOT_FOUND',
        message: 'Customer not found.',
      });
    return data;
  }
  async create(u: string, c: string, d: CustomerInput) {
    if (!d.name?.trim() || !d.customerCode?.trim())
      throw new BadRequestException({
        code: 'INVALID_CUSTOMER',
        message: 'Customer code and name are required.',
      });
    const { data, error } = await this.repo.create(c, u, d);
    if (error) throw error;
    await this.audit.record({
      action: 'customer.created',
      resourceType: 'customer',
      resourceId: data.id,
      actorUserId: u,
      companyId: c,
    });
    return data;
  }
  async update(u: string, c: string, id: string, d: Partial<CustomerInput>) {
    await this.get(c, id);
    const { data, error } = await this.repo.update(c, id, d);
    if (error) throw error;
    await this.audit.record({
      action: 'customer.updated',
      resourceType: 'customer',
      resourceId: id,
      actorUserId: u,
      companyId: c,
    });
    return data;
  }
}

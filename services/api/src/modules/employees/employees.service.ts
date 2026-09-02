import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { EmployeesRepository } from './employees.repository.js';
import type {
  AssignmentInput,
  EmployeeInput,
  WorkShiftInput,
} from './dto/employee.dto.js';
@Injectable()
export class EmployeesService {
  constructor(
    private readonly repo: EmployeesRepository,
    private readonly audit: AuditService,
  ) {}
  async list(c: string) {
    const { data, error } = await this.repo.list(c);
    if (error) throw error;
    return data ?? [];
  }
  async get(c: string, id: string) {
    const { data, error } = await this.repo.get(c, id);
    if (error) throw error;
    if (!data)
      throw new NotFoundException({
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found.',
      });
    return data;
  }
  async create(u: string, c: string, d: EmployeeInput) {
    if (!d.employeeCode?.trim() || !d.name?.trim())
      throw new BadRequestException({
        code: 'INVALID_EMPLOYEE',
        message: 'Employee code and name are required.',
      });
    const { data, error } = await this.repo.create(c, u, d);
    if (error) throw error;
    await this.audit.record({
      action: 'employee.created',
      resourceType: 'employee',
      resourceId: data.id,
      actorUserId: u,
      companyId: c,
    });
    return data;
  }
  async update(u: string, c: string, id: string, d: Partial<EmployeeInput>) {
    await this.get(c, id);
    const { data, error } = await this.repo.update(c, id, d);
    if (error) throw error;
    await this.audit.record({
      action: 'employee.updated',
      resourceType: 'employee',
      resourceId: id,
      actorUserId: u,
      companyId: c,
    });
    return data;
  }
  async assign(u: string, c: string, id: string, d: AssignmentInput) {
    await this.get(c, id);
    const { data, error } = await this.repo.assign(c, u, id, d);
    if (error) throw error;
    await this.audit.record({
      action: 'employee.assigned',
      resourceType: 'employee',
      resourceId: id,
      actorUserId: u,
      companyId: c,
      branchId: d.branchId,
    });
    return data;
  }
  async shift(u: string, c: string, d: WorkShiftInput) {
    if (new Date(d.scheduledEnd) <= new Date(d.scheduledStart))
      throw new BadRequestException({
        code: 'INVALID_WORK_SHIFT',
        message: 'Shift end must be after start.',
      });
    const { data, error } = await this.repo.shift(c, u, d);
    if (error) throw error;
    return data;
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { AuditService } from '../audit/audit.service.js';
import { BarcodesRepository } from './barcodes.repository.js';
import type { BarcodeInput } from './dto/barcode.dto.js';
@Injectable()
export class BarcodesService {
  constructor(
    private readonly repo: BarcodesRepository,
    private readonly audit: AuditService,
  ) {}
  async lookup(c: string, code: string) {
    const { data, error } = await this.repo.find(c, code);
    if (error) throw error;
    if (!data)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Barcode not found.',
      });
    return data;
  }
  async create(u: string, c: string, d: BarcodeInput) {
    const internal = !d.code;
    const code = d.code?.trim() ?? `899${Date.now()}${randomInt(100, 999)}`;
    if (code.length < 4)
      throw new BadRequestException({
        code: 'INVALID_BARCODE',
        message: 'Barcode is too short.',
      });
    const { data, error } = await this.repo.create({
      company_id: c,
      product_id: d.productId,
      code,
      source: internal ? 'internal' : (d.source ?? 'manual'),
      is_primary: d.isPrimary ?? true,
      created_by: u,
    });
    if (error) throw error;
    await this.audit.record({
      action: 'barcode.generate',
      resourceType: 'barcode',
      resourceId: data.id,
      actorUserId: u,
      companyId: c,
      metadata: { source: internal ? 'internal' : (d.source ?? 'manual') },
    });
    return {
      ...data,
      label: { barcode: code, productId: d.productId, format: 'CODE128' },
    };
  }
}

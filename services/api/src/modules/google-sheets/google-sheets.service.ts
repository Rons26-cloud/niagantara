import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { validateServerEnvironment } from '../../config/environment.js';
import { GoogleClient } from './google-client.js';
import { defaultColumns, monthlySheetTitle } from './sheet-builder.js';
import {
  encryptToken,
  hashOAuthState,
  validateFormulaTemplate,
} from './google-security.js';
import { GoogleSheetsRepository } from './google-sheets.repository.js';
import type {
  ColumnInput,
  CreateWorkbookInput,
  DefinitionInput,
} from './dto.js';
@Injectable()
export class GoogleSheetsService {
  constructor(
    private readonly repo: GoogleSheetsRepository,
    private readonly google: GoogleClient,
  ) {}
  async status(c: string) {
    const [
      { data: connection, error },
      { data: workbook },
      { data: definitions },
    ] = await Promise.all([
      this.repo.connection(c),
      this.repo.workbook(c),
      this.repo.definitions(c),
    ]);
    if (error) throw error;
    return { connection, workbook, definitions: definitions ?? [] };
  }
  async oauthStart(c: string, u: string, replace = false) {
    const state = randomBytes(32).toString('base64url');
    const { error } = await this.repo.oauthState({
      company_id: c,
      actor_user_id: u,
      state_hash: hashOAuthState(state),
      replace_existing: replace,
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    });
    if (error) throw error;
    return {
      authorizationUrl: this.google.authorizationUrl(state),
      expiresInSeconds: 600,
    };
  }
  async callback(code: string, state: string) {
    if (!code || !state)
      throw new BadRequestException({ code: 'INVALID_OAUTH_CALLBACK' });
    const { data: s, error } = await this.repo.state(hashOAuthState(state));
    if (error || !s)
      throw new BadRequestException({ code: 'INVALID_OR_EXPIRED_OAUTH_STATE' });
    const consumed = await this.repo.consumeState(s.id);
    if (consumed.error)
      throw new BadRequestException({ code: 'OAUTH_STATE_ALREADY_USED' });
    const tokens = await this.google.exchange(code);
    if (!tokens.refresh_token)
      throw new BadRequestException({ code: 'GOOGLE_REFRESH_TOKEN_MISSING' });
    const info = await this.google.userInfo(tokens.access_token);
    const env = validateServerEnvironment();
    const { data, error: saveError } = await this.repo.saveConnection({
      company_id: s.company_id,
      google_account_id: info.sub,
      google_email: info.email,
      encrypted_refresh_token: encryptToken(
        tokens.refresh_token,
        env.googleTokenEncryptionKey!,
      ),
      scopes: (tokens.scope ?? '').split(' ').filter(Boolean),
      status: 'active',
      connected_by: s.actor_user_id,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_error_code: null,
    });
    if (saveError) throw saveError;
    await this.audit(
      s.company_id,
      s.actor_user_id,
      s.replace_existing ? 'google.account.replaced' : 'google.connected',
      data.id,
    );
    return { connected: true, companyId: s.company_id, email: info.email };
  }
  async createWorkbook(c: string, u: string, input: CreateWorkbookInput) {
    if (!input.title?.trim())
      throw new BadRequestException({ code: 'WORKBOOK_TITLE_REQUIRED' });
    const existing = await this.repo.workbook(c);
    if (existing.data)
      throw new BadRequestException({ code: 'ACTIVE_WORKBOOK_EXISTS' });
    const connection = await this.repo.privateConnection(c);
    if (!connection.data || connection.data.status !== 'active')
      throw new BadRequestException({ code: 'GOOGLE_NOT_CONNECTED' });
    const token = await this.google.accessToken(
      connection.data.encrypted_refresh_token,
    );
    const remote = await this.google.createSpreadsheet(
      token,
      input.title.trim(),
    );
    const { data, error } = await this.repo.createWorkbook({
      company_id: c,
      connection_id: connection.data.id,
      spreadsheet_id: remote.spreadsheetId,
      spreadsheet_url: remote.spreadsheetUrl,
      title: input.title.trim(),
      timezone: input.timezone ?? 'Asia/Jakarta',
      created_by: u,
    });
    if (error) throw error;
    for (const [position, dataset] of [
      'sales',
      'inventory',
      'purchases',
      'finance',
    ].entries()) {
      const d = await this.repo.createDefinition({
        company_id: c,
        workbook_id: data.id,
        dataset,
        title: dataset[0]!.toUpperCase() + dataset.slice(1),
        monthly: true,
        position,
      });
      if (d.error) throw d.error;
      const columns = defaultColumns(dataset).map((x) => ({
        ...x,
        company_id: c,
        definition_id: d.data.id,
      }));
      const created = await this.repo.createColumns(columns);
      if (created.error) throw created.error;
    }
    await this.repo.enqueue({
      company_id: c,
      dataset: 'rebuild',
      source_table: 'companies',
      source_id: c,
      source_event_key: `rebuild:${data.id}:initial`,
    });
    await this.audit(c, u, 'sheet.workbook.created', data.id);
    return data;
  }
  async addDefinition(c: string, u: string, input: DefinitionInput) {
    const w = await this.repo.workbook(c);
    if (!w.data) throw new NotFoundException({ code: 'WORKBOOK_NOT_FOUND' });
    const d = await this.repo.createDefinition({
      company_id: c,
      workbook_id: w.data.id,
      ...input,
      title: input.title.trim(),
    });
    if (d.error) throw d.error;
    const cols = await this.repo.createColumns(
      defaultColumns(input.dataset).map((x) => ({
        ...x,
        company_id: c,
        definition_id: d.data.id,
      })),
    );
    if (cols.error) throw cols.error;
    await this.audit(c, u, 'sheet.definition.created', d.data.id);
    return d.data;
  }
  async updateDefinition(
    c: string,
    u: string,
    id: string,
    input: Partial<DefinitionInput> & { status?: 'active' | 'archived' },
  ) {
    const update: any = { updated_at: new Date().toISOString() };
    if (input.title) update.title = input.title.trim();
    if (typeof input.monthly === 'boolean') update.monthly = input.monthly;
    if (input.status)
      Object.assign(update, {
        status: input.status,
        archived_at:
          input.status === 'archived' ? new Date().toISOString() : null,
      });
    const r = await this.repo.updateDefinition(c, id, update);
    if (r.error) throw r.error;
    await this.audit(c, u, `sheet.definition.${input.status ?? 'updated'}`, id);
    return r.data;
  }
  async addColumn(
    c: string,
    u: string,
    definitionId: string,
    input: ColumnInput,
  ) {
    if (input.dataType === 'formula')
      validateFormulaTemplate(input.formulaTemplate ?? '');
    const r = await this.repo.addColumn({
      company_id: c,
      definition_id: definitionId,
      column_key: input.columnKey,
      label: input.label,
      position: input.position ?? 999,
      data_type: input.dataType,
      formula_template: input.formulaTemplate,
    });
    if (r.error) throw r.error;
    await this.audit(c, u, 'sheet.column.created', r.data.id);
    return r.data;
  }
  async updateColumn(
    c: string,
    u: string,
    id: string,
    input: Partial<ColumnInput> & { status?: 'active' | 'archived' },
  ) {
    if (input.formulaTemplate) validateFormulaTemplate(input.formulaTemplate);
    const v: any = { updated_at: new Date().toISOString() };
    for (const [k, to] of [
      ['columnKey', 'column_key'],
      ['label', 'label'],
      ['position', 'position'],
      ['dataType', 'data_type'],
      ['formulaTemplate', 'formula_template'],
    ] as const)
      if (input[k] !== undefined) v[to] = input[k];
    if (input.status)
      Object.assign(v, {
        status: input.status,
        archived_at:
          input.status === 'archived' ? new Date().toISOString() : null,
      });
    const r = await this.repo.updateColumn(c, id, v);
    if (r.error) throw r.error;
    await this.audit(c, u, `sheet.column.${input.status ?? 'updated'}`, id);
    return r.data;
  }
  history(c: string) {
    return this.repo.history(c).then((r) => {
      if (r.error) throw r.error;
      return r.data ?? [];
    });
  }
  async recovery(c: string) {
    const r = await this.repo.failures(c);
    if (r.error) throw r.error;
    return r.data ?? [];
  }
  async retry(c: string, u: string, id: string) {
    const r = await this.repo.retry(c, id);
    if (r.error) throw r.error;
    await this.audit(c, u, 'sheet.sync.retried', id);
    return r.data;
  }
  async rebuild(c: string, u: string) {
    const w = await this.repo.workbook(c);
    if (!w.data) throw new NotFoundException({ code: 'WORKBOOK_NOT_FOUND' });
    const key = `rebuild:${w.data.id}:${Date.now()}`;
    const r = await this.repo.enqueue({
      company_id: c,
      dataset: 'rebuild',
      source_table: 'companies',
      source_id: c,
      source_event_key: key,
      payload: { requested_by: u },
    });
    if (r.error) throw r.error;
    await this.audit(c, u, 'sheet.rebuild.queued', w.data.id);
    return { queued: true, key };
  }
  monthlyTitle(title: string, date?: Date) {
    return monthlySheetTitle(title, date);
  }
  private async audit(c: string, u: string, action: string, id?: string) {
    const r = await this.repo.audit({
      company_id: c,
      actor_user_id: u,
      action,
      resource_type: 'google_sheet',
      resource_id: id,
      metadata: {},
    });
    if (r.error) throw r.error;
  }
}

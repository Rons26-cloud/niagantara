-- NIAGANTARA Phase 5: tenant-isolated Google Sheets reporting and durable sync.
-- Supabase remains authoritative. Google credentials and writes are server-only.

create table public.google_connections(
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 google_account_id text not null, google_email text not null, encrypted_refresh_token text not null,
 scopes text[] not null default array[]::text[], status text not null default 'active' check(status in('active','revoked','error')),
 last_error_code text, connected_by uuid not null references public.profiles(id), connected_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(company_id), unique(id,company_id)
);
create table public.google_oauth_states(
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 actor_user_id uuid not null references public.profiles(id), state_hash text not null unique, replace_existing boolean not null default false,
 expires_at timestamptz not null, consumed_at timestamptz, created_at timestamptz not null default now()
);
create table public.sheet_workbooks(
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 connection_id uuid not null, spreadsheet_id text not null, spreadsheet_url text not null, title text not null,
 timezone text not null default 'Asia/Jakarta', status text not null default 'active' check(status in('active','archived','rebuilding','error')),
 created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 archived_at timestamptz, unique(company_id,spreadsheet_id), unique(id,company_id),
 foreign key(connection_id,company_id) references public.google_connections(id,company_id) on delete restrict
);
create unique index sheet_workbooks_one_active_idx on public.sheet_workbooks(company_id) where status in('active','rebuilding');
create table public.sheet_definitions(
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 workbook_id uuid not null, dataset text not null check(dataset in('sales','inventory','purchases','finance')),
 title text not null check(length(btrim(title)) between 1 and 80), monthly boolean not null default true,
 position integer not null default 0 check(position>=0), status text not null default 'active' check(status in('active','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
 unique(workbook_id,dataset), unique(id,company_id), foreign key(workbook_id,company_id) references public.sheet_workbooks(id,company_id) on delete cascade
);
create table public.sheet_columns(
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 definition_id uuid not null, column_key text not null check(column_key ~ '^[a-z][a-z0-9_]{0,63}$'),
 label text not null check(length(btrim(label)) between 1 and 80), position integer not null check(position>=0),
 data_type text not null default 'text' check(data_type in('text','number','currency','date','datetime','boolean','formula')),
 formula_template text, status text not null default 'active' check(status in('active','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
 unique(definition_id,column_key), unique(id,company_id),
 foreign key(definition_id,company_id) references public.sheet_definitions(id,company_id) on delete cascade,
 check((data_type='formula' and formula_template is not null) or (data_type<>'formula' and formula_template is null)),
 check(formula_template is null or (length(formula_template)<=500 and formula_template ~ '^=' and formula_template !~* '(IMPORTRANGE|IMPORTXML|IMPORTHTML|IMPORTDATA|GOOGLEFINANCE|HYPERLINK)'))
);
create table public.sheet_sync_queue(
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 dataset text not null check(dataset in('sales','inventory','purchases','finance','rebuild')),
 source_table text not null, source_id uuid, source_event_key text not null, payload jsonb not null default '{}'::jsonb,
 status text not null default 'queued' check(status in('queued','processing','retry','completed','dead')),
 attempts integer not null default 0 check(attempts between 0 and 20), max_attempts integer not null default 8 check(max_attempts between 1 and 20),
 available_at timestamptz not null default now(), locked_at timestamptz, locked_by text, completed_at timestamptz,
 last_error_code text, last_error_message text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(company_id,source_event_key), unique(id,company_id)
);
create index sheet_sync_queue_claim_idx on public.sheet_sync_queue(status,available_at,created_at) where status in('queued','retry');
create table public.sheet_sync_history(
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 queue_id uuid, workbook_id uuid, dataset text not null, source_event_key text not null, outcome text not null check(outcome in('success','retry','failed','skipped')),
 attempt integer not null, rows_written integer not null default 0, google_request_id text, error_code text, error_message text,
 started_at timestamptz not null, finished_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb,
 foreign key(queue_id,company_id) references public.sheet_sync_queue(id,company_id) on delete set null (queue_id),
 foreign key(workbook_id,company_id) references public.sheet_workbooks(id,company_id) on delete set null (workbook_id)
);
create index sheet_sync_history_scope_idx on public.sheet_sync_history(company_id,finished_at desc);

do $$ declare t text; begin foreach t in array array['google_connections','google_oauth_states','sheet_workbooks','sheet_definitions','sheet_columns','sheet_sync_queue','sheet_sync_history'] loop
 execute format('alter table public.%I enable row level security',t); execute format('revoke all on table public.%I from anon,authenticated',t); end loop; end $$;
grant select(id,company_id,google_account_id,google_email,scopes,status,last_error_code,connected_by,connected_at,updated_at) on public.google_connections to authenticated;
grant select on public.sheet_workbooks,public.sheet_definitions,public.sheet_columns,public.sheet_sync_queue,public.sheet_sync_history to authenticated;
create policy google_connections_read on public.google_connections for select to authenticated using((select private.has_phase2_permission(company_id,null,'sheet.read')));
create policy sheet_workbooks_read on public.sheet_workbooks for select to authenticated using((select private.has_phase2_permission(company_id,null,'sheet.read')));
create policy sheet_definitions_read on public.sheet_definitions for select to authenticated using((select private.has_phase2_permission(company_id,null,'sheet.read')));
create policy sheet_columns_read on public.sheet_columns for select to authenticated using((select private.has_phase2_permission(company_id,null,'sheet.read')));
create policy sheet_sync_queue_read on public.sheet_sync_queue for select to authenticated using((select private.has_phase2_permission(company_id,null,'sheet.manage')));
create policy sheet_sync_history_read on public.sheet_sync_history for select to authenticated using((select private.has_phase2_permission(company_id,null,'sheet.read')));

create or replace function private.enqueue_sheet_sync() returns trigger language plpgsql security definer set search_path='' as $$
declare row_data jsonb; tenant uuid; record_id uuid; target_dataset text; event_key text;
begin
 row_data:=to_jsonb(new); tenant:=(row_data->>'company_id')::uuid; record_id:=(row_data->>'id')::uuid;
 target_dataset:=case tg_table_name when 'sales' then 'sales' when 'inventory' then 'inventory' when 'purchases' then 'purchases' when 'financial_transactions' then 'finance' end;
 if target_dataset is null then return new; end if;
 event_key:=tg_table_name||':'||record_id::text||':'||md5(row_data::text);
 insert into public.sheet_sync_queue(company_id,dataset,source_table,source_id,source_event_key)
 values(tenant,target_dataset,tg_table_name,record_id,event_key) on conflict(company_id,source_event_key) do nothing;
 return new;
end $$;
revoke all on function private.enqueue_sheet_sync() from public,anon,authenticated;
grant execute on function private.enqueue_sheet_sync() to service_role;
create trigger sales_sheet_sync after insert or update on public.sales for each row execute function private.enqueue_sheet_sync();
create trigger inventory_sheet_sync after insert or update on public.inventory for each row execute function private.enqueue_sheet_sync();
create trigger purchases_sheet_sync after insert or update on public.purchases for each row execute function private.enqueue_sheet_sync();
create trigger finance_sheet_sync after insert or update on public.financial_transactions for each row execute function private.enqueue_sheet_sync();

create or replace function public.claim_sheet_sync_jobs(worker_name text,batch_size integer default 20) returns setof public.sheet_sync_queue
language plpgsql security definer set search_path='' as $$ begin
 return query with candidates as (
  select q.id from public.sheet_sync_queue q where (q.status in('queued','retry') and q.available_at<=now()) or (q.status='processing' and q.locked_at<now()-interval '10 minutes')
  order by q.available_at,q.created_at for update skip locked limit greatest(1,least(batch_size,100))
 ) update public.sheet_sync_queue q set status='processing',attempts=q.attempts+1,locked_at=now(),locked_by=left(worker_name,120),updated_at=now()
 from candidates c where q.id=c.id returning q.*;
end $$;
revoke all on function public.claim_sheet_sync_jobs(text,integer) from public,anon,authenticated;
grant execute on function public.claim_sheet_sync_jobs(text,integer) to service_role;

insert into public.permissions(permission_key,display_name) values
 ('sheet.read','Read Google Sheets integration'),('sheet.manage','Manage Google Sheets integration')
on conflict(permission_key) do update set display_name=excluded.display_name;
insert into public.role_permissions(role_id,permission_id)
 select r.id,p.id from public.roles r join public.permissions p on p.permission_key in('sheet.read','sheet.manage')
 where r.scope='company' and r.role_key in('owner','company_admin') on conflict do nothing;
insert into public.role_permissions(role_id,permission_id)
 select r.id,p.id from public.roles r join public.permissions p on p.permission_key='sheet.read'
 where r.scope='company' and r.role_key in('finance','accountant') on conflict do nothing;

comment on table public.google_connections is 'Server-only encrypted Google OAuth connection metadata; tokens are never exposed through application DTOs.';
comment on table public.sheet_sync_queue is 'Durable at-least-once reporting queue; Supabase records remain authoritative.';

import { Injectable } from '@nestjs/common';import { SupabaseService } from '../../integrations/supabase/supabase.service.js';
@Injectable() export class GoogleSheetsRepository{constructor(readonly db:SupabaseService){}
 connection(c:string){return this.db.client.from('google_connections').select('id,company_id,google_account_id,google_email,scopes,status,last_error_code,connected_at,updated_at').eq('company_id',c).maybeSingle()}
 privateConnection(c:string){return this.db.client.from('google_connections').select('*').eq('company_id',c).maybeSingle()}
 oauthState(v:any){return this.db.client.from('google_oauth_states').insert(v)} state(hash:string){return this.db.client.from('google_oauth_states').select('*').eq('state_hash',hash).is('consumed_at',null).gt('expires_at',new Date().toISOString()).maybeSingle()}
 consumeState(id:string){return this.db.client.from('google_oauth_states').update({consumed_at:new Date().toISOString()}).eq('id',id).is('consumed_at',null).select().single()}
 saveConnection(v:any){return this.db.client.from('google_connections').upsert(v,{onConflict:'company_id'}).select('id,company_id,google_account_id,google_email,scopes,status,connected_at,updated_at').single()}
 workbook(c:string){return this.db.client.from('sheet_workbooks').select('*').eq('company_id',c).in('status',['active','rebuilding']).maybeSingle()}
 createWorkbook(v:any){return this.db.client.from('sheet_workbooks').insert(v).select().single()}
 definitions(c:string){return this.db.client.from('sheet_definitions').select('*,columns:sheet_columns(*)').eq('company_id',c).order('position').order('position',{referencedTable:'sheet_columns'})}
 createDefinition(v:any){return this.db.client.from('sheet_definitions').insert(v).select().single()}
 createColumns(v:any[]){return this.db.client.from('sheet_columns').insert(v).select()}
 updateDefinition(c:string,id:string,v:any){return this.db.client.from('sheet_definitions').update(v).eq('company_id',c).eq('id',id).select().single()}
 updateColumn(c:string,id:string,v:any){return this.db.client.from('sheet_columns').update(v).eq('company_id',c).eq('id',id).select().single()}
 addColumn(v:any){return this.db.client.from('sheet_columns').insert(v).select().single()}
 history(c:string){return this.db.client.from('sheet_sync_history').select('*').eq('company_id',c).order('finished_at',{ascending:false}).limit(100)}
 failures(c:string){return this.db.client.from('sheet_sync_queue').select('*').eq('company_id',c).in('status',['retry','dead']).order('updated_at',{ascending:false}).limit(100)}
 retry(c:string,id:string){return this.db.client.from('sheet_sync_queue').update({status:'queued',attempts:0,available_at:new Date().toISOString(),last_error_code:null,last_error_message:null}).eq('company_id',c).eq('id',id).select().single()}
 enqueue(v:any){return this.db.client.from('sheet_sync_queue').upsert(v,{onConflict:'company_id,source_event_key',ignoreDuplicates:true}).select().maybeSingle()}
 audit(v:any){return this.db.client.from('audit_logs').insert(v)}
}

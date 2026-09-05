-- Broadcast newly recorded audit entries to authorized company dashboards.
-- The existing tenant-scoped broadcast function only emits identifiers and
-- leaves audit data retrieval to the authenticated API/RLS path.
drop trigger if exists audit_logs_realtime_broadcast on public.audit_logs;
create trigger audit_logs_realtime_broadcast
after insert on public.audit_logs
for each row execute function private.broadcast_business_change();

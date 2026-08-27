export type IntegrationStatus = 'HEALTHY' | 'SYNCING' | 'WARNING' | 'FAILED' | 'NOT_CONNECTED' | 'UNKNOWN';
export function normalizeSheetsStatus(connection?: { status?: string } | null, queue?: { status?: string } | null, history?: { outcome?: string } | null): IntegrationStatus {
  if (!connection || ['disconnected', 'revoked', 'not_connected'].includes(String(connection.status).toLowerCase())) return 'NOT_CONNECTED';
  if (queue && ['queued', 'processing', 'retry'].includes(String(queue.status).toLowerCase())) return queue.status === 'retry' ? 'WARNING' : 'SYNCING';
  if (history?.outcome === 'success') return 'HEALTHY';
  if (history?.outcome === 'failed') return 'FAILED';
  if (history?.outcome === 'retry') return 'WARNING';
  return 'UNKNOWN';
}

import { createWorker } from './sheet-worker.js';
const interval = Math.max(
  1000,
  Number(process.env.SHEET_SYNC_INTERVAL_MS || 5000),
);
let stopping = false;
let wake: undefined | (() => void);
const log = (
  level: string,
  event: string,
  fields: Record<string, unknown> = {},
) =>
  process.stdout.write(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      event,
      service: 'niagantara-sheet-worker',
      environment: process.env.APP_ENV || process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '0.1.0',
      build_sha: process.env.BUILD_SHA || 'local',
      ...fields,
    }) + '\n',
  );
const pause = () =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      wake = undefined;
      resolve();
    }, interval);
    wake = () => {
      clearTimeout(timer);
      wake = undefined;
      resolve();
    };
  });
async function loop() {
  const worker = createWorker();
  log('info', 'worker.started', {
    worker_id: process.env.WORKER_ID || `sheets-${process.pid}`,
  });
  while (!stopping) {
    try {
      const count = await worker.runOnce();
      if (count > 0) log('info', 'worker.batch_completed', { jobs: count });
      else await pause();
    } catch (e) {
      log('error', 'worker.batch_failed', {
        code: e instanceof Error ? e.name : 'WORKER_ERROR',
        message: e instanceof Error ? e.message : 'Worker batch failed',
      });
      if (!stopping) await pause();
    }
  }
  log('info', 'worker.stopped');
}
function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  wake?.();
  log('info', 'worker.shutdown_requested', { signal });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
void loop().catch((error) => {
  log('fatal', 'worker.bootstrap_failed', {
    code: error instanceof Error ? error.name : 'WORKER_BOOTSTRAP_FAILED',
    message: error instanceof Error ? error.message : 'Worker bootstrap failed',
  });
  process.exitCode = 1;
});

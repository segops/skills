/**
 * Shared server-side SegOps client.
 *
 * Import `segops` anywhere on the server to track events. A secret key (sk_)
 * authenticates directly — never import this from browser/client code.
 *
 *   import { segops } from './lib/segops';
 *   segops.track({ userId: user.id, eventType: 'order_placed', payload: { total: 42 } });
 */
import { SegOpsClient } from '@segops/sdk';

const apiUrl = process.env.SEGOPS_API_URL;
const apiKey = process.env.SEGOPS_SECRET_KEY;

if (!apiUrl || !apiKey) {
  throw new Error(
    'SegOps: set SEGOPS_API_URL and SEGOPS_SECRET_KEY (sk_…) in your environment.',
  );
}

export const segops = new SegOpsClient({
  apiUrl,
  apiKey,
  // Tune batching for your traffic; defaults are batchSize 20 / flushInterval 5s.
  onError: (err) => console.error('[segops]', err.message),
});

/** Flush pending events and stop the background timer. Call on process exit. */
export async function shutdownSegOps(): Promise<void> {
  try {
    await segops.shutdown();
  } catch (err) {
    console.error('[segops] shutdown flush failed', err);
  }
}

// Flush the queue on termination so the last events aren't dropped. If your
// framework has a shutdown hook (e.g. NestJS onApplicationShutdown), call
// shutdownSegOps() from there instead and remove these listeners.
let shuttingDown = false;
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    void shutdownSegOps().finally(() => process.exit(0));
  });
}

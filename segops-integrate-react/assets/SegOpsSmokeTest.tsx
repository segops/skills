/**
 * Temporary smoke test. Render this once inside <SegOpsProvider> to confirm
 * events reach SegOps, then delete it.
 *
 *   <SegOpsProvider ...>
 *     <SegOpsSmokeTest />
 *     <App />
 *   </SegOpsProvider>
 */
import { useEffect } from 'react';
import { useSegOps } from '@segops/sdk/react';

export function SegOpsSmokeTest() {
  const segops = useSegOps();
  useEffect(() => {
    segops.track({
      userId: 'smoke-test',
      eventType: 'segops_smoke_test',
      payload: { source: 'segops-integrate-react' },
    });
    // Flush immediately so it shows up without waiting for the batch timer.
    void segops.flush().then(() => console.log('✓ SegOps test event sent'));
  }, [segops]);
  return null;
}

export default SegOpsSmokeTest;

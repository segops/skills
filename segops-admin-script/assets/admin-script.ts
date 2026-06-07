/**
 * SegOps Admin one-off script scaffold.
 *
 *   SEGOPS_API_URL=http://localhost:8000 SEGOPS_SECRET_KEY=sk_... \
 *     npx tsx admin-script.ts
 *
 * Fill in main() with your task (see the skill's resource map). Requires a
 * secret key (sk_…) — the Admin SDK rejects pk_/mk_ keys.
 */
import { SegOpsAdmin, SegOpsApiError } from '@segops/admin';

const apiUrl = process.env.SEGOPS_API_URL;
const apiKey = process.env.SEGOPS_SECRET_KEY;
if (!apiUrl || !apiKey) {
  throw new Error('Set SEGOPS_API_URL and SEGOPS_SECRET_KEY (sk_…).');
}

const DRY_RUN = process.env.DRY_RUN === '1';
const segops = new SegOpsAdmin({ apiKey, baseUrl: `${apiUrl}/api` });

async function main() {
  // Example: recompute every segment (set DRY_RUN=1 to preview).
  for await (const s of segops.segments.iterate()) {
    if (DRY_RUN) {
      console.log('[dry-run] would recompute', s.id, s.name);
      continue;
    }
    await segops.segments.recompute(s.id);
    console.log('recompute →', s.name);
  }
}

main().catch((err) => {
  if (err instanceof SegOpsApiError) {
    console.error(`SegOps API error ${err.status}:`, err.message);
  } else {
    console.error(err);
  }
  process.exit(1);
});

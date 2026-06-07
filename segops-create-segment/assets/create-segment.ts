/**
 * One-off: preview → create → compute a SegOps segment.
 *
 *   SEGOPS_API_URL=http://localhost:8000 SEGOPS_SECRET_KEY=sk_... \
 *     npx tsx create-segment.ts
 *
 * Edit `definition` and the name/description for your audience. Requires a
 * secret key (sk_…) — the Admin SDK rejects pk_/mk_ keys.
 */
import { SegOpsAdmin } from '@segops/admin';

const apiUrl = process.env.SEGOPS_API_URL;
const apiKey = process.env.SEGOPS_SECRET_KEY;
if (!apiUrl || !apiKey) {
  throw new Error('Set SEGOPS_API_URL and SEGOPS_SECRET_KEY (sk_…).');
}

const segops = new SegOpsAdmin({ apiKey, baseUrl: `${apiUrl}/api` });

// ── Edit this for your audience (see the skill's DSL table) ──────────────────
const definition = {
  logic: 'AND',
  conditions: [
    { type: 'monetary', event_type: 'order_placed', property: 'total', metric: 'sum', operator: 'gte', value: 500 },
    { type: 'recency', event_type: 'order_placed', operator: 'gt', window_days: 30 },
  ],
};
const name = 'High-value lapsed';
const description = 'Spent ≥ €500 total, no order in 30 days';
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const preview = await segops.segments.preview(definition);
  console.log('Preview:', preview);

  const segment = await segops.segments.create({ name, description, segment_type: 'rule', definition });
  console.log(`Created segment #${segment.id} — ${segment.name}`);

  await segops.segments.recompute(segment.id);
  console.log('Recompute kicked off; member_count will populate shortly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

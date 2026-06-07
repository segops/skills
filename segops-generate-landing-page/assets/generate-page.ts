/**
 * One-off: generate → build → publish a SegOps AI landing page.
 *
 *   SEGOPS_API_URL=http://localhost:8000 SEGOPS_SECRET_KEY=sk_... \
 *     npx tsx generate-page.ts "best running shoes for flat feet"
 *
 * Requires a secret key (sk_…).
 */
import { SegOpsAdmin } from '@segops/admin';

const apiUrl = process.env.SEGOPS_API_URL;
const apiKey = process.env.SEGOPS_SECRET_KEY;
if (!apiUrl || !apiKey) {
  throw new Error('Set SEGOPS_API_URL and SEGOPS_SECRET_KEY (sk_…).');
}

const query = process.argv[2] ?? 'best running shoes for flat feet';
const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const segops = new SegOpsAdmin({ apiKey, baseUrl: `${apiUrl}/api` });

async function main() {
  const page = await segops.pages.create({ slug, query });
  console.log(`Created page #${page.id} (${slug})`);

  await segops.pages.build(page.id, {});
  console.log('Build kicked off — poll builder_status until it is built.');

  const fresh = await segops.pages.get(page.id);
  console.log('builder_status:', fresh.builder_status);

  // Uncomment to publish once built:
  // await segops.pages.publish(page.id);
  // console.log('Published.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

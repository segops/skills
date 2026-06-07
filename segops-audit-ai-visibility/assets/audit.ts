/**
 * Quick AI-visibility audit. Simulates an ad-hoc query and prints the
 * workspace rollups, then leave summarizing to the agent.
 *
 *   SEGOPS_API_URL=http://localhost:8000 SEGOPS_SECRET_KEY=sk_... \
 *     npx tsx audit.ts "best CRM for startups"
 *
 * Requires a secret key (sk_…).
 */
import { SegOpsAdmin } from '@segops/admin';

const apiUrl = process.env.SEGOPS_API_URL;
const apiKey = process.env.SEGOPS_SECRET_KEY;
if (!apiUrl || !apiKey) {
  throw new Error('Set SEGOPS_API_URL and SEGOPS_SECRET_KEY (sk_…).');
}

const queryText = process.argv[2] ?? 'best CRM for startups';
const segops = new SegOpsAdmin({ apiKey, baseUrl: `${apiUrl}/api` });

async function main() {
  console.log(`\n# Ad-hoc simulation: "${queryText}"`);
  console.log(JSON.stringify(await segops.queries.simulate({ query_text: queryText }), null, 2));

  console.log('\n# Dashboard');
  console.log(JSON.stringify(await segops.queries.dashboard(), null, 2));

  console.log('\n# Win rate');
  console.log(JSON.stringify(await segops.queries.winRate(), null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

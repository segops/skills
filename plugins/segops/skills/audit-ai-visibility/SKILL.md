---
name: audit-ai-visibility
description: "Audit how visible a brand is in AI assistant answers (ChatGPT, Perplexity, Claude, Gemini). Use when a developer or marketer wants to check AI visibility / share of voice, see whether a brand shows up in AI answers for key queries, simulate AI queries, or summarize AI-reach findings. Uses the published @segops/admin SDK to simulate/run queries and summarize results."
argument-hint: "Optional: a query to test, e.g. \"best CRM for startups\""
---

# Audit AI visibility

Measure whether a brand appears in AI assistant answers for the queries that
matter, using the SegOps AI-reach API via **`@segops/admin`**. Two modes:
**simulate** an ad-hoc query, or **run** queries already registered in the
workspace and summarize the results.

**Prerequisite:** a server-side **secret key** (`sk_…`).

## 1. Install the Admin SDK

```bash
npm install @segops/admin
```

## 2. Configure key + API URL

```bash
SEGOPS_API_URL=http://localhost:8000   # your SegOps API base URL
SEGOPS_SECRET_KEY=sk_xxx
```

```ts
import { SegOpsAdmin } from '@segops/admin';
const segops = new SegOpsAdmin({
  apiKey: process.env.SEGOPS_SECRET_KEY!,
  baseUrl: `${process.env.SEGOPS_API_URL}/api`,
});
```

## 3a. Simulate an ad-hoc query (no registration)

Best for a quick "do we show up for this?" check:

```ts
const sim = await segops.queries.simulate({ query_text: 'best CRM for startups' });
console.log(sim); // per-provider answers + extracted brand mentions/positions
```

## 3b. Or run the registered queries

Audit the workspace's tracked queries:

```ts
for await (const q of segops.queries.iterate()) {
  await segops.queries.run(q.id);          // run now
  const results = await segops.queries.results(q.id);
  console.log(q.query_text, results);
}
```

## 4. Pull the rollups

```ts
const dashboard = await segops.queries.dashboard(); // overall visibility snapshot
const winRate = await segops.queries.winRate();     // share-of-voice vs competitors
```

## 5. Summarize the findings

From the results, report for the user:

- **Presence** — which queries mention the brand at all, and which don't.
- **Position** — average rank when mentioned (lower is better); flag queries
  where competitors outrank the brand.
- **Provider gaps** — providers (ChatGPT/Perplexity/Claude/Gemini) where the
  brand is absent.
- **Win rate** — share of voice from `winRate()`, trend if available.
- **Top opportunities** — high-intent queries with no/low presence to target
  next (pair with `generate-landing-page`).

Keep it concise: a short table of query → present? → position → top competitor,
then 3–5 prioritized recommendations.

## Notes

- `simulate` doesn't persist; `run` records results against a registered query
  so trends accumulate over time.
- Provider coverage and scheduling depend on the workspace's AI-reach config.

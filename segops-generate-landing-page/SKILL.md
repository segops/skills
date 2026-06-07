---
name: segops-generate-landing-page
description: "Generate an AI-optimized landing page in SegOps. Use when a developer or marketer wants to create a landing page, generate a page for a search query or topic, build an AI-visibility page, or publish a generated page. Uses the published @segops/admin SDK to generate, build, publish, and export pages."
argument-hint: "A query/topic or slug, e.g. \"best running shoes for flat feet\""
---

# Generate an AI landing page

Drive the SegOps AI page builder with the **`@segops/admin`** SDK: generate a
page for a query/topic, build it, publish it, and optionally export the source.

**Prerequisite:** a server-side **secret key** (`sk_…`).

> **Catalog note:** ships in the public `segops/skills` catalog (M29).

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

## 3. Generate the page

**One page** — create it, then build the page document:

```ts
const page = await segops.pages.create({
  slug: 'best-running-shoes-flat-feet',
  query: 'best running shoes for flat feet', // the target query/topic
});

await segops.pages.build(page.id, {}); // assemble blocks (M20 builder)
```

**Many pages at once** — generate from a batch of queries:

```ts
await segops.pages.bulkGenerate({ queries: ['best trail shoes', 'waterproof hiking boots'] });
```

To ground a page in your catalog, the builder can pull products via semantic
search:

```ts
const matches = await segops.pages.query('running shoes for flat feet');
```

## 4. Check status, then publish

```ts
let p = await segops.pages.get(page.id);
console.log(p.builder_status); // poll until it's built

await segops.pages.publish(page.id);
```

If you want to iterate on the copy, `segops.pages.regenerate(page.id)` then
build again before publishing.

## 5. (Optional) export the source

```ts
const job = await segops.pages.export(page.id, { format: 'tsx' }); // 'tsx' | 'html' | 'json'
console.log(job.status, job.download_url);
```

## 6. Verify

`segops.pages.get(id)` → confirm `builder_status` is built/published, or open
the page in the SegOps dashboard. Exports are async — poll the job's `status`
until a `download_url` appears.
